from flask import Flask,render_template,request,redirect,url_for
from flask_socketio import SocketIO, emit
from adafruit_motorkit import MotorKit
from sense_hat import SenseHat
from adafruit_ads1x15.analog_in import AnalogIn
import os     
import time
import datetime
#set pwm/ rear motor (looks strange but has to be like that )
os.system ("sudo pigpiod") 
time.sleep(1) 
import pigpio
import board
import busio
import sqlite3
import adafruit_ads1x15.ads1115 as ADS
import socket 

#set flask application
app = Flask(__name__)
#set websocket
socketio = SocketIO(app)
#set rear engine pwm min=700, max=2000 , 1350 not rotating
ESC=12
pi = pigpio.pi()
old_Y=0
#set front engine min=0 , max 1.0
left=0.8
right=-0.8
kit = MotorKit()
kit.motor1.throttle = 0
#set analog-digital converter
i2c = busio.I2C(board.SCL, board.SDA)
ads = ADS.ADS1115(i2c)
chan = AnalogIn(ads, ADS.P0)
#set sensors Hat
sense = SenseHat()
#set database
conn=sqlite3.connect('database.db')
db=conn.cursor()




@app.route("/")
def index():
    return render_template('index.html')

@app.route("/pictures")
@app.route("/pictures/<string:picture>")
def pictures(picture=None):
    db.execute("SELECT * FROM pictures")
    data=db.fetchall()
    if (picture) == None:
        db.execute("SELECT COUNT(*) FROM pictures")
        result=db.fetchone()
        id=result[0]-1
        displayed_photo_id=id
    else:
        displayed_photo_id=picture
    return render_template('pictures.html',data=data,displayed_photo_id=displayed_photo_id)

@socketio.on('connect')
def connect(): 
    humidity,temp,pressure=get_sensors()
    pi.set_servo_pulsewidth(ESC, 1350)
    kit.motor1.throttle = 0
    print('CONNECTED')
    emit("sensors",{"pressure":pressure,"temp":temp,"humidity":humidity})
    
@socketio.on('disconnect')
def disconnect():
    pi.set_servo_pulsewidth(ESC, 1350)
    kit.motor1.throttle = 0
    print('DISCONNECTED')
    
@socketio.on('run')
def run(data):
    new_Y=data['axisY']
    #run rear engine
    global old_Y
    if (new_Y != old_Y):
        #comment this line to turn off main engine
        pi.set_servo_pulsewidth(ESC,new_Y)
        old_Y=new_Y      
    target=data['axisX']
    current=round(chan.voltage,2)
    difference=target-current
    if (difference>0.2 or difference<-0.2):
        start = datetime.datetime.now().timestamp()
        while (difference>0.2 or difference<-0.2):
            print('stuck in loop')       
            end = datetime.datetime.now().timestamp()
            result=end-start
            print(result)
            if (result>0.4):
                break
            if (target>current):            
                kit.motor1.throttle = right             
            elif (target<current):    
                kit.motor1.throttle = left       
            current=round(chan.voltage,2)
            difference=target-current         
            print('target: '+str(target)+' current: ' +str(current))     
        kit.motor1.throttle = 0      
    else:
        kit.motor1.throttle = 0


@socketio.on('camera')
def camera(data): 
    if (data['state']):
        os.system('sudo motion -b')
        time.sleep(1)
        emit("camera",{'camera':data['state']})
    else:
        os.system('sudo systemctl start motion.service')
        os.system('sudo systemctl stop motion.service')
        emit("camera",{'camera':data['state']})

@socketio.on('take_a_picture')
def take_a_picture():
    humidity,temp,pressure=get_sensors()
    db.execute("SELECT COUNT(*) FROM pictures")
    result=db.fetchone()
    id=result[0]
    
    db.execute("INSERT INTO pictures VALUES (?, ?, ?, ?, date('now'), time('now'))", (id, humidity, temp, pressure))
    conn.commit()
    os.system('sudo systemctl start motion.service')
    os.system('sudo systemctl stop motion.service')
    command='raspistill -t 500 -w 1920 -h 1080 -rot 180 -n -o /home/pi/Desktop/final/static/pictures/'+str(id)+'.jpg'
    os.system(command)
    os.system('sudo motion -b')
    time.sleep(1)
    print('done')
    emit("picture_taken")
    
@socketio.on('arm')
def arm():
    print('armed')
    pi.set_servo_pulsewidth(ESC, 1350)
    print('zero')
    time.sleep(1)
    pi.set_servo_pulsewidth(ESC, 2000)
    print('2000')
    time.sleep(1)
    pi.set_servo_pulsewidth(ESC, 1350)
    print('zero')
    time.sleep(1)    
    

def get_sensors():
    pressure = sense.get_pressure()
    pressure = round(pressure)
    temp = sense.get_temperature_from_pressure()
    temp = round(temp,1)
    humidity = sense.get_humidity()
    humidity = round(humidity,1)
    return humidity,temp,pressure
    
My final project for: HarvardX: CS50W.
CS50's Web Programming with Python and JavaScript

It is a python controlled car. 

Installed latest Raspbian , a version of linux on Raspberry Pi 3 B+

It supports python3 together with Flask and SocketIO
so web server is running physically on the car.

Server is visible across the local network for other machines. 
Access to website on port :5000. 
It has 8MP camera streaming to port 8081.
I inserted this address to "href" attribute of <img> tag.
Most important element of rendered website is <svg> tag , basically two circles used for 
controlling direction and acceleration of car.

It is responsive, runs well on mobile phones, tablets and laptops, however 
I adjust height of website to Opera's full screen mode to maximize visible content and 
remove address bar. 

Application imports quite a few modules, some of them runs only on Linux and some only 
with Raspberry components.

Files:
1. start.sh it turns on camera streaming in background and run flask server visible to all users
connected to local network

2. application.py main app file , import all modules , perform some settings, render websites
and exchange(emit & listen) data with client

3. index.html main website, I used touch events rather then click to support touchscreens
-left side controlls power of rear engine
-center displays camera streaming 
-on the bottom are reading from sennsors
-right bottom corner contain <svg> for controlling
-right top side:
	-arming rear engine (if automatically not armed)
	-slow mode (constant slow speed)
	-camera on/off
	-capture a picture 
	-gallery button (display gallery in new tab)

4. pictures.html it loads data from database - humidity, pressure, temp, date , time and picture filename. 
Pictures are stored in static folder . Everything is loaded to table with Jinja2.

5. styles.css contain all styling
line "user-select:none;" disable text-selection (sometimes text was selected when smaller <svg> was dragged)
body's overflow is set to hidden to disable pull-down-to-refresh feature
(sometimes dragging <svg> down browser reload the entire page)

6. script.js client side code , communicate with server side , mainly <svg> events controll car movement

7. database.db  I used sqlite3 to keep database localy as car has no internet connection yet
database contain picture filename and readings from all sensors plus date and time

8. requirements.txt except flask and flask-SocketIO
 , adafruit_motorkit need to be imported
(to controll front engine), sense_hat ( to read all sensors) and adafruit_ads1x15.analog_in
(to convert analog singnal from encoder do digital version for Raspberry Pi) 


Wiring:
I removed oryginal board and battery, both engines with gears stay on places.
Parts used:
-Raspberry Pi 3 B+
-DC & Stepper Motor HAT
-Sense HAT
-ADS1115 I2C 4 Analog/Digital Converter
-Raspberry Pi Camera Board V2
-Lipo Battery Low Voltage Alarm
-Battery 3S 11.1V 3000mAh 30C Li-Po
-60A Brushed Electric Speed Controller
-power manager soldered myself out of two resistors (step down 5V to 3V3)



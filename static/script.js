$(function(){   
    // document ready 
    let socket=io.connect(location.protocol+'//'+document.domain+':'+location.port);
	power=0.2;
	oldaxisX=0;
    oldaxisY=0;
    local_ip='http://192.168.0.35:8081/';
    $('#cameraWrapper img').attr('src',local_ip);
    
    
    socket.on('connect',()=>{
        socket.sendBuffer = [];
    });
   
    let svg=$('#svg_control');
    let smallCircle=$('#smallCircle');
    let bigCircle=$('#bigCircle');
    let svgWidth=parseInt(svg.css('width'),10)
    let svgHeight=parseInt(svg.css('height'),10)
    let centerX=parseInt(svgWidth,10)/2
    let centerY=parseInt(svgHeight,10)/2
    let setR=Math.round(svgWidth*0.4)
	range=Math.round(setR*0.7);
    bigCircle.attr('cx',centerX).attr('cy',centerY).attr('r',setR)
    smallCircle.attr('cx',centerX).attr('cy',centerY).attr('r',setR/3)

     
    $('#smallCircle,#bigCircle').on('touchstart',function() {
        svg.on('touchmove touchstart',function(event) {
			let touch = event.targetTouches[0];
			
            let mouseX=touch.pageX;
            let mouseY=touch.pageY;
            let offsetX=window.innerWidth-(svgWidth/2);
            let offsetY=window.innerHeight-(svgHeight/2);

            let a=mouseX-offsetX
            let b=mouseY-offsetY
            let r=Math.round(Math.sqrt(a*a+b*b));
            let angle=Math.atan2(b, a);
            
            let x =centerX+ Math.cos(angle) * range;
            let y =centerY+ Math.sin(angle) * range;
            if (r<range) {
                smallCircle.attr('cx',mouseX-offsetX+svgWidth/2).attr('cy',mouseY-offsetY+svgHeight/2)
            }else {
                smallCircle.attr('cx',x).attr('cy',y)
            }
            axisX=Math.round($('#smallCircle').attr('cx')-centerX);
            axisY=Math.round(centerY-$('#smallCircle').attr('cy'));
            let oldMax=range;
            let oldMin=range*-1;
            axisY=Math.round(scale(axisY,oldMin,oldMax,calc_power(power)[0],calc_power(power)[1]));
            if (axisX>=50) {
                axisX=50;
                }
            if (axisX<=-50) {
                axisX=-50;
                }
			axisX=Number(scale(axisX,oldMin,oldMax,0,1.9).toFixed(2));
            //$('#humidity').html(axisX);
            if ($('#slow_mode_switch').is(':checked') && axisY>1350) {
                axisY=1440;
            }
            if ($('#slow_mode_switch').is(':checked') && axisY<1350) {
                axisY=1260;
            }
			if ((axisX!=oldaxisX) || (axisY!=oldaxisY)) {
                oldaxisX=axisX;
                oldaxisY=axisY;      
                socket.emit('run',{'axisY':axisY,'axisX':axisX});
            }
        })
    })
    svg.on('touchend',function() {
        svg.off('touchmove');
        smallCircle.attr('cx',centerX).attr('cy',centerY).attr('r',setR/3)
        let axisY=Math.round(centerY-$('#smallCircle').attr('cy'));
        let oldMax=range;
        let oldMin=range*-1;
        axisY=Math.round(scale(axisY,oldMin,oldMax,calc_power(power)[0],calc_power(power)[1]));
        if (axisY!=oldaxisY) {
            oldaxisY=axisY;
            socket.emit('run',{'axisY':axisY,'axisX':axisX});
        }
    })
    $('#arm').on('click',function() {
        socket.emit('arm');
    });
    
    $('#take_a_picture').on('click',function() {
        $('.lds-dual-ring').css('visibility','visible');
        socket.emit('take_a_picture');
        
    });
    
    socket.on('picture_taken',data=> {
        $('#cameraWrapper img').attr('src',local_ip);
        $('#camera_off').css('visibility','hidden');
        $('.lds-dual-ring').css('visibility','hidden');
    });
    
    $('#gallery').on('click',function() {
        window.open('/pictures');
        
    });
    
    $('#camera_switch').change(function() {
        let state=$(this).is(":checked");
        socket.emit('camera',{'state':state});
    });
    
    socket.on('camera',data=> {
        if (data['camera']) {
            $('#cameraWrapper img').attr('src',local_ip);
            $('#camera_off').css('visibility','hidden');
        } else {
            $('#cameraWrapper img').attr('src','');
            $('#camera_off').css('visibility','visible');
            $('.lds-dual-ring').css('visibility','hidden');
        }
    });
    
    socket.on('sensors', data=> {
    $('#humidity').html(data["humidity"]+'%');
    $('#temp').html(data["temp"]+'°C');
    $('#pressure').html(data["pressure"]+'mbar');
    });
});




function scale(value,oldMin,oldMax,newMin,newMax) {
	return (value - oldMin) * (newMax - newMin) / (oldMax - oldMin) + newMin;
}


function setPower(data) {
    switch(data) {
        case 100:
            power=1;
            $('#power_100').css('fill','darkred');
            $('#power_80').css('fill','red');
            $('#power_60').css('fill','orange');
            $('#power_40').css('fill','yellow');
        break;
        case 80: 
            power=0.8;
            $('#power_100').css('fill','white');
            $('#power_80').css('fill','red');
            $('#power_60').css('fill','orange');
            $('#power_40').css('fill','yellow');
        break;
        case 60: 
        power=0.6;
            $('#power_100').css('fill','white');
            $('#power_80').css('fill','white');
            $('#power_60').css('fill','orange');
            $('#power_40').css('fill','yellow');
        break;
        case 40: 
            power=0.4;
            $('#power_100').css('fill','white');
            $('#power_80').css('fill','white');
            $('#power_60').css('fill','white');
            $('#power_40').css('fill','yellow');
        break;
        case 20: 
            power=0.2;
            $('#power_100').css('fill','white');
            $('#power_80').css('fill','white');
            $('#power_60').css('fill','white');
            $('#power_40').css('fill','white');
    }
}

function calc_power(data) {
    //engine min is 700 and max is 2000, at 1350 engine is not rotating

    let min=1350-(650*data);
    let max=1350+(650*data);
    return [min,max]
}

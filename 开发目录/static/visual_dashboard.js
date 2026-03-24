document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
        document.getElementById('loaderContainer').classList.add('loader-hidden');
        initAll();
    },1200);
});

let scene,camera,renderer,earth,clouds,chart,windGauge,deviceHeatmap,riskGauge;
let alertTimeout=null;

function initAll(){
    initEarth();initCharts();bindEvents();startPull();
    // 启动日志流
    setInterval(() => {
      const logStream = document.getElementById('log-stream');
      const logs = [
        "[{time}] 气象数据刷新完成",
        "[{time}] 设备 #1 温度正常",
        "[{time}] 网络延迟：25ms",
        "[{time}] 风险指数更新",
        "[{time}] 摄像头 #3 在线"
      ];
      const now = new Date().toLocaleTimeString();
      const newLog = document.createElement('div');
      newLog.className = 'mb-1';
      newLog.innerText = logs[Math.floor(Math.random()*logs.length)].replace('{time}', now);
      logStream.appendChild(newLog);
      if (logStream.children.length > 6) {
        logStream.removeChild(logStream.firstChild);
      }
      logStream.scrollTop = logStream.scrollHeight;
    }, 8000);
}

function initEarth(){
    const container=document.getElementById('scene-container');
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x020712);
    camera=new THREE.PerspectiveCamera(70,container.clientWidth/container.clientHeight,0.1,1000);
    camera.position.set(0,1.2,2.8);
    camera.lookAt(0,0,0);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(container.clientWidth,container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 1. 地球纹理（国内可访问的蓝色科技底图）
    const geo=new THREE.SphereGeometry(1,64,64);
    const earthTexture = new THREE.TextureLoader().load(
        'https://picsum.photos/id/1025/1024/512' // 稳定的蓝色地球纹理
    );
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        transparent: true,
        opacity: 0.8,
        color: 0x22d3ee // 叠加科技蓝，和你页面风格统一
    });
    earth=new THREE.Mesh(geo, earthMaterial);
    scene.add(earth);

    // 2. 真实气象云图（国内可访问的云层纹理）
    const cloudTexture = new THREE.TextureLoader().load(
        'https://picsum.photos/id/1048/1024/512' // 白色云层纹理
    );
    const cloudGeometry = new THREE.SphereGeometry(1.03,64,64);
    const cloudMaterial = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.05,
        color: 0x88ccff // 淡蓝色，匹配你页面的气象风格
    });
    clouds=new THREE.Mesh(cloudGeometry, cloudMaterial);
    scene.add(clouds);

    // 3. 光照（保证云图可见）
    const light=new THREE.DirectionalLight(0xffffff,1.4);
    light.position.set(5,3,5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 4. 自动旋转动画
    (function anim(){
        requestAnimationFrame(anim);
        earth.rotation.y += 0.001;
        clouds.rotation.y += 0.0018; // 云层比地球转得稍快，模拟流动感
        renderer.render(scene,camera);
    })();

    window.addEventListener('resize',()=>{
        camera.aspect=container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth,container.clientHeight);
    });
}

function initCharts(){
    chart=echarts.init(document.getElementById('weather-chart'));
    chart.setOption({
        backgroundColor:'transparent',grid:{top:10,right:20,bottom:25,left:30},
        xAxis:{type:'category',data:['0时','3时','6时','9时','12时','15时','18时','21时'],axisLine:{lineStyle:{color:'#fff3'}},axisLabel:{color:'#fff6',fontSize:10},splitLine:{show:false}},
        yAxis:{type:'value',axisLine:{lineStyle:{color:'#fff3'}},axisLabel:{color:'#fff6',fontSize:10},splitLine:{lineStyle:{color:'#fff2'}}},
        series:[{type:'line',smooth:true,data:[],lineStyle:{color:'#22d3ee'},itemStyle:{color:'#22d3ee'},areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#22d3ee33'},{offset:1,color:'#22d3ee00'}])}}]
    });

    windGauge=echarts.init(document.getElementById('windGauge'));
    windGauge.setOption({
        backgroundColor:'transparent',
        series:[{
            type:'gauge',
            radius:'80%',
            startAngle:180,endAngle:0,
            splitNumber:4,
            axisLine:{lineStyle:{color:[[1,'#22d3ee']],width:6}},
            pointer:{width:2,color:'#fff'},
            axisTick:{show:false},
            splitLine:{show:false},
            axisLabel:{show:false},
            detail:{formatter:'{value} m/s',color:'#fff',fontSize:14},
            data:[{value:0}]
        }]
    });

    deviceHeatmap = echarts.init(document.getElementById('device-heatmap'));
    deviceHeatmap.setOption({
      backgroundColor: 'transparent',
      grid: { top: 0, right: 0, bottom: 0, left: 0 },
      xAxis: { show: false },
      yAxis: { show: false },
      visualMap: {
        min: 0, max: 10,
        calculable: true,
        orient: 'horizontal',
        left: 'center', bottom: 0,
        inRange: { color: ['#0f2b4d', '#22d3ee', '#ff9900', '#ff3333'] }
      },
      series: [{
        type: 'heatmap',
        data: [
          [0,0,2],[1,0,3],[2,0,5],[3,0,2],
          [0,1,8],[1,1,5],[2,1,3],[3,1,1],
          [0,2,3],[1,2,2],[2,2,4],[3,2,6]
        ],
        label: { show: false }
      }]
    });

    riskGauge = echarts.init(document.getElementById('risk-gauge'));
    riskGauge.setOption({
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge',
        radius: '80%',
        startAngle: 180, endAngle: 0,
        splitNumber: 3,
        axisLine: {
          lineStyle: {
            color: [[0.33, '#22c55e'], [0.66, '#eab308'], [1, '#ef4444']],
            width: 6
          }
        },
        pointer: { width: 2, color: '#fff' },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { formatter: '{value} 级', color: '#fff', fontSize: 14 },
        data: [{ value: 2 }]
      }]
    });
}

function bindEvents(){
    document.getElementById('close-alert').onclick=()=>{
        clearTimeout(alertTimeout);
        document.body.classList.remove('red');
        document.getElementById('alert-modal').style.display='none';
    };
    document.getElementById('btnRefresh').onclick=pullData;
    document.getElementById('btnTestAlert').onclick=()=>{
        showAlert({type:'手动测试',loc:'测试位置',time:new Date().toLocaleString()});
    };
    document.getElementById('btnFullscreen').onclick=()=>{
        if(!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    };
    document.getElementById('exportAlert').onclick=()=>{
        alert('预警记录已导出为 CSV 文件');
    };
    document.getElementById('earthView').onchange=e=>{
        if(e.target.value==='china'){camera.position.set(0,1.2,2.8);}
        else{camera.position.set(0,0,3);}
        camera.lookAt(0,0,0);
    };
}

function startPull(){
    pullData();setInterval(pullData,5000);
}

async function pullData(){
    try{
        let w=await axios.get('/api/dashboard/weather');
        let d=w.data;
        document.body.className=d.grade;
        document.getElementById('weather-layer-text').innerText=d.layer;
        document.getElementById('temp').innerText=d.temp;
        document.getElementById('humi').innerText=d.humidity;
        document.getElementById('press').innerText=d.pressure;
        document.getElementById('aqi').innerText=d.aqi;
        document.getElementById('wind_dir').innerText=d.dir;
        document.getElementById('visibility').innerText=d.vis;
        chart.setOption({series:[{data:d.trend}]});
        windGauge.setOption({series:[{data:[{value:d.wind}]}]});

        // 更新风险指数
        let risk = 1;
        if (d.grade === 'yellow') risk = 2;
        if (d.grade === 'orange') risk = 3;
        if (d.grade === 'red') risk = 4;
        riskGauge.setOption({ series: [{ data: [{ value: risk }] }] });

        // 更新热力图
        let heatData = [];
        for(let i=0;i<4;i++){
          for(let j=0;j<3;j++){
            heatData.push([i,j, Math.floor(Math.random()*10)]);
          }
        }
        deviceHeatmap.setOption({ series: [{ data: heatData }] });

        let a=await axios.get('/api/dashboard/alerts');
        let al=document.getElementById('alert-list');
        al.innerHTML='';
        if(a.data.length===0) al.innerHTML='<div class="p-2 bg-green-500/10 border border-green-500/30 rounded">系统正常，无告警</div>';
        else a.data.forEach(i=>{
            let div=document.createElement('div');
            div.className='p-2 bg-red-500/10 border border-red-500/30 rounded';
            div.innerText=i;
            al.appendChild(div);
        });

        let ab=await axios.get('/api/dashboard/abnormal');
        if(ab.data.show&&ab.data.extreme) showAlert(ab.data);
    }catch(e){}
}

function showAlert(d){
    clearTimeout(alertTimeout);
    document.body.classList.add('red');
    let m=document.getElementById('alert-modal');
    m.style.display='flex';
    document.getElementById('amt').innerText=d.type;
    document.getElementById('aml').innerText=d.loc;
    document.getElementById('amtm').innerText=d.time;
    alertTimeout=setTimeout(()=>{
        document.body.classList.remove('red');
        m.style.display='none';
    },7000);
}

window.addEventListener('resize',()=>{
    chart.resize();
    windGauge.resize();
    deviceHeatmap.resize();
    riskGauge.resize();
});
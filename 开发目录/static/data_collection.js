document.addEventListener('DOMContentLoaded', function() {
    const sceneSelect = document.getElementById('scene');
    const form = document.getElementById('dataCollectionForm');
    const resultDiv = document.getElementById('submitResult');

    let sceneChartInstance = null;

    // 场景切换
    sceneSelect.addEventListener('change', function() {
        document.querySelectorAll('.factory-field, .orchard-field, .school-field, .hospital-field, .mall-field')
            .forEach(el => el.classList.add('hidden'));

        if (this.value === 'factory') document.querySelector('.factory-field').classList.remove('hidden');
        else if (this.value === 'orchard') document.querySelector('.orchard-field').classList.remove('hidden');
        else if (this.value === 'school') document.querySelector('.school-field').classList.remove('hidden');
        else if (this.value === 'hospital') document.querySelector('.hospital-field').classList.remove('hidden');
        else if (this.value === 'mall') document.querySelector('.mall-field').classList.remove('hidden');
    });

    // 提交表单
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {
            scene: sceneSelect.value,
            basic_info: {
                name: formData.get('name'),
                face_data: formData.get('face_data'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                age: formData.get('age'),
                gender: formData.get('gender')
            },
            specific_info: {}
        };

        if (data.scene === 'factory') {
            data.specific_info = {
                worker_id: formData.get('worker_id'),
                workshop_id: formData.get('workshop_id'),
                position: formData.get('position'),
                work_years: formData.get('work_years')
            };
        } else if (data.scene === 'orchard') {
            data.specific_info = {
                orchard_id: formData.get('orchard_id'),
                crop_type: formData.get('crop_type'),
                area: formData.get('area'),
                plant_years: formData.get('plant_years')
            };
        } else if (data.scene === 'school') {
            data.specific_info = {
                school_id: formData.get('school_id'),
                school_role: formData.get('school_role'),
                department: formData.get('department'),
                grade_or_years: formData.get('grade_or_years')
            };
        } else if (data.scene === 'hospital') {
            data.specific_info = {
                hospital_id: formData.get('hospital_id'),
                hospital_role: formData.get('hospital_role'),
                department: formData.get('department'),
                work_or_illness: formData.get('work_or_illness')
            };
        } else if (data.scene === 'mall') {
            data.specific_info = {
                mall_id: formData.get('mall_id'),
                mall_role: formData.get('mall_role'),
                floor_or_shop: formData.get('floor_or_shop'),
                work_or_frequency: formData.get('work_or_frequency')
            };
        }

        if (data.scene === 'factory' && !data.specific_info.worker_id) {
            showResult('工厂场景：工号必填', 'error'); return;
        }
        if (data.scene === 'school' && !data.specific_info.school_id) {
            showResult('校园场景：学号/工号必填', 'error'); return;
        }
        if (data.scene === 'hospital' && !data.specific_info.hospital_id) {
            showResult('医院场景：工号/患者号必填', 'error'); return;
        }
        if (data.scene === 'mall' && !data.specific_info.mall_id) {
            showResult('商场场景：员工号/顾客ID必填', 'error'); return;
        }

        fetch('/api/data_collection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                showResult('数据采集成功！', 'success');
                form.reset();
                sceneSelect.dispatchEvent(new Event('change'));
                loadStats();
                loadRecords();
            } else {
                showResult('提交失败：' + res.msg, 'error');
            }
        })
        .catch(err => showResult('网络错误', 'error'));
    });

    function showResult(msg, type) {
        resultDiv.textContent = msg;
        resultDiv.className = `mt-6 text-center ${type === 'success' ? 'text-success' : 'text-error'}`;
        resultDiv.classList.remove('hidden');
        setTimeout(() => resultDiv.classList.add('hidden'), 3000);
    }

    // 加载统计
    function loadStats() {
        fetch('/api/data_collection/records')
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const records = data.records;
                document.getElementById('totalRecords').textContent = records.length;

                const today = new Date().toISOString().split('T')[0];
                const todayCount = records.filter(r => r.collect_time && r.collect_time.startsWith(today)).length;
                document.getElementById('todayRecords').textContent = todayCount;

                const sceneCount = { home: 0, factory: 0, orchard: 0, school: 0, hospital: 0, mall: 0 };
                records.forEach(r => {
                    if(sceneCount.hasOwnProperty(r.scene)) sceneCount[r.scene]++;
                });

                const ctx = document.getElementById('sceneChart').getContext('2d');
                if (sceneChartInstance) sceneChartInstance.destroy();

                sceneChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['家庭', '工厂', '果园', '校园', '医院', '商场'],
                        datasets: [{
                            data: [sceneCount.home, sceneCount.factory, sceneCount.orchard, sceneCount.school, sceneCount.hospital, sceneCount.mall],
                            backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#ef4444', '#ec4899']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { color: '#e2e8f0', font: { size: 10 } } }
                        }
                    }
                });
            });
    }

    // 加载记录
    function loadRecords(scene = '') {
        fetch(`/api/data_collection/records?scene=${scene}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const list = document.getElementById('recordsList');
                list.innerHTML = '';
                document.getElementById('listTotal').textContent = data.records.length;

                data.records.forEach(r => {
                    const item = document.createElement('div');
                    item.className = 'p-4 border-b border-slate-700';
                    const name = r.basic_info?.name || '未填写';
                    const location = r.basic_info?.location || '未填写';
                    const collectTime = r.collect_time || '无时间';
                    let sceneText = '';
                    switch(r.scene){
                        case 'home': sceneText='家庭'; break;
                        case 'factory': sceneText='工厂'; break;
                        case 'orchard': sceneText='果园'; break;
                        case 'school': sceneText='校园'; break;
                        case 'hospital': sceneText='医院'; break;
                        case 'mall': sceneText='商场'; break;
                        default: sceneText='未知';
                    }

                    item.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="text-sm font-bold text-white">${name} | ${sceneText}</div>
                                <div class="text-xs text-slate-400 mt-1">${collectTime} | ${location}</div>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">${sceneText}</span>
                        </div>
                    `;
                    list.appendChild(item);
                });
            });
    }

    // 筛选
    document.querySelectorAll('.scene-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.scene-filter-btn').forEach(b =>
                b.classList.remove('bg-cyan-500/20', 'text-cyan-400')
            );
            this.classList.add('bg-cyan-500/20', 'text-cyan-400');
            loadRecords(this.dataset.scene);
        });
    });

    loadStats();
    loadRecords();
    document.querySelector('.scene-filter-btn[data-scene=""]').classList.add('bg-cyan-500/20', 'text-cyan-400');
});
class FloatingUI {
    constructor() {
        this.recordings = this.loadRecordings();
        this.selectedRecording = null;
        this.visible = this.loadVisibleState();
        
        // 先创建所有UI元素的引用
        this.controlPanel = null;
        this.floatingBall = null;
        this.recordingsList = null;
        this.stepsList = null;
        this.toggleBtn = null;
        
        // 初始化UI
        this.init();
    }

    init() {
        this.createControlPanel();
        this.createFloatingBall();
        this.createRecordingsList();
        this.createToggleButton();
        this.updateVisibility();
    }

    loadRecordings() {
        return JSON.parse(localStorage.getItem('uigo_recordings') || '[]');
    }

    loadVisibleState() {
        return JSON.parse(localStorage.getItem('uigo_visible') || 'true');
    }

    saveState() {
        localStorage.setItem('uigo_recordings', JSON.stringify(this.recordings));
        localStorage.setItem('uigo_visible', JSON.stringify(this.visible));
    }

    toggleVisibility() {
        this.visible = !this.visible;
        this.updateVisibility();
        this.saveState();
    }

    updateVisibility() {
        if (!this.visible) {
            const elements = [this.controlPanel, this.floatingBall, this.recordingsList];
            elements.forEach(el => {
                if (el) el.style.display = 'hidden';
            });
        } else {
            if (this.controlPanel) this.controlPanel.style.display = 'visible';
            if (this.floatingBall) this.floatingBall.style.display = 'visible';
            if (this.recordingsList) {
                this.recordingsList.style.display = this.recordingsList.classList.contains('show') ? 'visible' : 'hidden';
            }
        }
        
        if (this.toggleBtn) {
            this.toggleBtn.textContent = this.visible ? '隐藏' : '显示';
        }
    }

    createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'uigo-control-panel';
        
        const bar = document.createElement('div');
        bar.className = 'uigo-floating-bar';
        
        const recordBtn = document.createElement('button');
        recordBtn.textContent = 'Record';
        recordBtn.onclick = () => this.toggleRecording();
        
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.className = 'play-btn';
        playBtn.onclick = async () => {
            if (window.uigoRecorder && this.selectedRecording) {
                await window.uigoRecorder.playRecording(this.selectedRecording);
            }
        };
        
        const listBtn = document.createElement('button');
        listBtn.textContent = 'Records';
        listBtn.onclick = () => this.toggleRecordingsList();
        
        bar.appendChild(recordBtn);
        bar.appendChild(playBtn);
        bar.appendChild(listBtn);
        
        const stepsList = document.createElement('div');
        stepsList.className = 'uigo-steps-list';
        
        panel.appendChild(bar);
        panel.appendChild(stepsList);
        
        this.makeDraggable(panel, true);
        document.body.appendChild(panel);
        
        this.controlPanel = panel;
        this.stepsList = stepsList;
    }

    createToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = this.visible ? '隐藏' : '显示';
        toggleBtn.onclick = () => this.toggleVisibility();
        toggleBtn.className = 'toggle-btn';
        this.controlPanel.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;
    }

    makeDraggable(element, constrainToWindow = false) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;
            
            if (constrainToWindow) {
                const rect = element.getBoundingClientRect();
                newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));
                newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
            }
            
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
            if (constrainToWindow) {
                element.style.transform = 'none';
            }
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    createFloatingBall() {
        const ball = document.createElement('div');
        ball.className = 'uigo-floating-ball';
        
        const vLine = document.createElement('div');
        vLine.className = 'vertical-line';
        const hLine = document.createElement('div');
        hLine.className = 'horizontal-line';
        
        ball.appendChild(vLine);
        ball.appendChild(hLine);
        
        this.makeDraggable(ball, true);
        document.body.appendChild(ball);
    }

    createRecordingsList() {
        const list = document.createElement('div');
        list.className = 'uigo-recordings-list';
        document.body.appendChild(list);
        this.recordingsList = list;
    }

    updateStepsList(events) {
        this.stepsList.innerHTML = '';
        if (!events || events.length === 0) return;

        events.forEach((event, index) => {
            const item = document.createElement('div');
            item.className = 'step-item';
            
            const type = document.createElement('div');
            type.className = 'step-type';
            
            switch (event.type) {
                case 'click':
                    type.textContent = 'Click';
                    break;
                case 'change':
                    if (event.target.tagName === 'SELECT') {
                        type.textContent = `Select "${event.value}"`;
                    } else {
                        type.textContent = `Input "${event.value}"`;
                    }
                    break;
                case 'fetch':
                    type.textContent = `${event.method} ${event.status || ''} ${new URL(event.url).pathname}`;
                    break;
                default:
                    type.textContent = event.type;
            }
            
            const coords = document.createElement('div');
            coords.className = 'step-coordinates';
            if (event.coordinates) {
                coords.textContent = `[${Math.round(event.coordinates.x)}, ${Math.round(event.coordinates.y)}]`;
            }
            
            item.appendChild(type);
            item.appendChild(coords);
            this.stepsList.appendChild(item);
        });
    }

    toggleRecording() {
        const recordBtn = document.querySelector('.uigo-floating-bar button');
        const isRecording = recordBtn.classList.contains('recording');
        
        if (!isRecording) {
            recordBtn.textContent = 'Stop';
            recordBtn.classList.add('recording');
            if (window.uigoRecorder) {
                window.uigoRecorder.start();
            }
            this.updateStepsList([]);
        } else {
            recordBtn.textContent = 'Record';
            recordBtn.classList.remove('recording');
            if (window.uigoRecorder) {
                const recording = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleString(),
                    events: window.uigoRecorder.events,
                    httpEvents: window.uigoRecorder.httpEvents
                };
                this.recordings.push(recording);
                this.updateRecordingsList();
                window.uigoRecorder.stop();
            }
        }
    }

    updateRecordingsList() {
        this.recordingsList.innerHTML = '';
        if (this.recordings.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'recording-empty';
            emptyMsg.textContent = '暂无录制记录';
            this.recordingsList.appendChild(emptyMsg);
            return;
        }

        this.recordings.forEach(recording => {
            const item = document.createElement('div');
            item.className = 'recording-item';
            if (this.selectedRecording === recording) {
                item.classList.add('selected');
            }
            
            const timestamp = document.createElement('div');
            timestamp.className = 'recording-timestamp';
            timestamp.textContent = recording.timestamp;
            
            const events = document.createElement('div');
            events.className = 'recording-events';
            events.textContent = `${recording.events.length} 个事件, ${recording.httpEvents.length} 个网络请求`;
            
            item.appendChild(timestamp);
            item.appendChild(events);
            item.onclick = () => this.selectRecording(recording);
            
            this.recordingsList.appendChild(item);
        });
    }

    toggleRecordingsList() {
        this.recordingsList.classList.toggle('show');
    }

    selectRecording(recording) {
        this.selectedRecording = recording;
        // 更新选中状态
        const items = this.recordingsList.querySelectorAll('.recording-item');
        items.forEach(item => {
            item.classList.toggle('selected', 
                item.querySelector('.recording-timestamp').textContent === recording.timestamp);
        });
    }

    playRecording() {
        if (!this.selectedRecording) {
            alert('Please select a recording first');
            return;
        }
        this.updateStepsList(this.selectedRecording.events);
        if (window.uigoRecorder) {
            window.uigoRecorder.playRecording(this.selectedRecording);
        }
    }
} 
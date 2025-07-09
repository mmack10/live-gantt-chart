import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// --- Helper Functions for Date Calculations ---
const addWorkingDays = (startDate, daysToAdd) => {
    let currentDate = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek > 0 && dayOfWeek < 6) {
            daysAdded++;
        }
    }
    return currentDate;
};

const getNextWorkday = (date) => {
    const nextDay = new Date(date);
    const dayOfWeek = nextDay.getDay();
    if (dayOfWeek === 6) { // Saturday
        nextDay.setDate(nextDay.getDate() + 2);
    } else if (dayOfWeek === 0) { // Sunday
        nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
};

// --- Initial Data ---
const initialTasksData = [
    { id: 1, name: 'Mobilization', durationDays: 0, durationHours: 3, is247: false },
    { id: 2, name: 'Rig-In', durationDays: 3, durationHours: 9.5, is247: false },
    { id: 3, name: 'Product Transfer', durationDays: 3, durationHours: 0, is247: true },
    { id: 4, name: 'Cannon Operations', durationDays: 5, durationHours: 9.5, is247: false },
    { id: 5, name: 'Ventilation', durationDays: 2, durationHours: 0, is247: true },
    { id: 6, name: 'Confined Space Entry', durationDays: 15, durationHours: 9.5, is247: false },
    { id: 7, name: 'EFR Cleaning', durationDays: 5, durationHours: 9.5, is247: false },
    { id: 8, name: 'Rig-Out', durationDays: 2, durationHours: 9.5, is247: false },
    { id: 9, name: 'Demobilization', durationDays: 0, durationHours: 3, is247: false },
];

// --- Main App Component ---
function App() {
    // --- State Management ---
    const [projectTitle, setProjectTitle] = useState('Dynamic Project Gantt Chart');
    const [projectSubtitle, setProjectSubtitle] = useState('Live Schedule with PDF Export');
    const [projectStartDateInput, setProjectStartDateInput] = useState('2025-07-09');
    const [tasks, setTasks] = useState(initialTasksData);
    const [scheduledTasks, setScheduledTasks] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const chartRef = useRef();

    // --- Load External Scripts for PDF Export ---
    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Script load error for ${src}`));
                document.head.appendChild(script);
            });
        };

        Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
        ]).catch(error => {
            console.error("Failed to load PDF libraries", error);
        });
    }, []);

    // --- Recalculation Effect ---
    useEffect(() => {
        const startDate = new Date(`${projectStartDateInput}T07:00:00`);
        let lastEndDate = new Date(startDate);
        
        const newScheduledTasks = tasks.map(task => {
            let taskStart, taskEnd;
            const durationDays = parseInt(task.durationDays, 10) || 0;
            const durationHours = parseFloat(task.durationHours) || 0;

            if (task.is247) {
                taskStart = new Date(lastEndDate);
                taskEnd = new Date(taskStart);
                taskEnd.setDate(taskEnd.getDate() + durationDays);
            } else {
                taskStart = getNextWorkday(lastEndDate);
                if (lastEndDate.getDay() > 0 && lastEndDate.getDay() < 6 && lastEndDate.getDate() === taskStart.getDate() && lastEndDate.getHours() > 7) {
                     taskStart = new Date(lastEndDate);
                } else {
                     taskStart.setHours(7, 0, 0, 0);
                }
                
                if (durationDays > 0) {
                    const taskEndDay = addWorkingDays(taskStart, durationDays - 1);
                    taskEnd = new Date(taskEndDay);
                    taskEnd.setHours(7, 0, 0, 0);
                    taskEnd.setHours(taskEnd.getHours() + durationHours);
                } else {
                    taskEnd = new Date(taskStart);
                    taskEnd.setHours(taskEnd.getHours() + durationHours);
                }
            }
            
            lastEndDate = taskEnd;
            return { ...task, start: taskStart, end: taskEnd };
        });

        setScheduledTasks(newScheduledTasks);
    }, [tasks, projectStartDateInput]);

    // --- Handlers ---
    const handleTaskUpdate = (id, field, value) => {
        const newTasks = tasks.map(task => {
            if (task.id === id) {
                const updatedValue = field === 'is247' ? !task.is247 : value;
                return { ...task, [field]: updatedValue };
            }
            return task;
        });
        setTasks(newTasks);
    };

    const handleExportPDF = () => {
        if (!window.jspdf || !window.html2canvas) {
            alert("PDF generation library is still loading. Please try again in a moment.");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;

        setIsExporting(true);
        const chartElement = chartRef.current;
        
        const originalWidth = chartElement.style.minWidth;
        chartElement.style.minWidth = '1600px';

        html2canvas(chartElement, {
            scale: 2,
            useCORS: true,
            scrollX: 0,
            scrollY: -window.scrollY,
            windowWidth: chartElement.scrollWidth,
            windowHeight: chartElement.scrollHeight
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${projectTitle.replace(/ /g, '_')}_Schedule.pdf`);
            
            chartElement.style.minWidth = originalWidth;
            setIsExporting(false);
        }).catch(err => {
            console.error("Error exporting PDF:", err);
            chartElement.style.minWidth = originalWidth;
            setIsExporting(false);
        });
    };

    // --- Memoized Values for Rendering ---
    const { chartStartDate, chartEndDate, totalDuration } = useMemo(() => {
        if (scheduledTasks.length === 0) return { chartStartDate: new Date(), chartEndDate: new Date(), totalDuration: 1 };
        const d_start = new Date(scheduledTasks[0].start);
        d_start.setDate(d_start.getDate() - 2);
        const d_end = new Date(scheduledTasks[scheduledTasks.length - 1].end);
        d_end.setDate(d_end.getDate() + 2);
        return { chartStartDate: d_start, chartEndDate: d_end, totalDuration: d_end.getTime() - d_start.getTime() };
    }, [scheduledTasks]);

    const timelineHeader = useMemo(() => {
        const months = [];
        let currentDate = new Date(chartStartDate);
        while (currentDate <= chartEndDate) {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            const monthYear = `${month} ${year}`;
            let monthObj = months.find(m => m.name === monthYear);
            if (!monthObj) {
                monthObj = { name: monthYear, days: [] };
                months.push(monthObj);
            }
            monthObj.days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return months;
    }, [chartStartDate, chartEndDate]);

    const formatDate = (date) => date ? date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : '';
    const colors = ['#3b82f6', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#6366f1'];

    return (
        <div style={{backgroundColor: '#f9fafb', color: '#1f2937', fontFamily: 'sans-serif', padding: '1.5rem'}}>
            <div style={{maxWidth: '100%', margin: 'auto'}}>
                 <header style={{marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img src="https://storage.googleapis.com/gemini-prod-us-west1-assets/e6558c38a2b53351_Vertexlogo-inv.png" alt="Vertex Logo" style={{height: '3rem'}} />
                        <div>
                            <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} style={{fontSize: '1.875rem', fontWeight: 'bold', backgroundColor: 'transparent', border: 'none', padding: 0, width: '100%'}} />
                            <input type="text" value={projectSubtitle} onChange={(e) => setProjectSubtitle(e.target.value)} style={{color: '#6b7280', marginTop: '0.25rem', backgroundColor: 'transparent', border: 'none', padding: 0, width: '100%'}} />
                        </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}>
                            <label htmlFor="startDate" style={{fontWeight: 600}}>Start Date:</label>
                            <input type="date" id="startDate" value={projectStartDateInput} onChange={(e) => setProjectStartDateInput(e.target.value)} style={{borderRadius: '0.375rem', border: '1px solid #d1d5db'}} />
                        </div>
                        <button onClick={handleExportPDF} disabled={isExporting} style={{backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', cursor: isExporting ? 'wait' : 'pointer'}}>
                           {isExporting ? 'Exporting...' : 'Export to PDF'}
                        </button>
                    </div>
                </header>

                <div ref={chartRef} style={{overflowX: 'auto', backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #e5e7eb'}}>
                    <div style={{display: 'flex', minWidth: '1600px'}}>
                        <div style={{width: '33.333333%', borderRight: '1px solid #e5e7eb', position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 20}}>
                            <div style={{height: '5rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', alignItems: 'center', padding: '1rem', backgroundColor: '#f3f4f6'}}>
                                <h2 style={{fontWeight: 600, gridColumn: 'span 2'}}>Task Name</h2>
                                <h2 style={{fontWeight: 600, textAlign: 'center'}}>Days</h2>
                                <h2 style={{fontWeight: 600, textAlign: 'center'}}>Shift Hours</h2>
                                <h2 style={{fontWeight: 600, textAlign: 'center'}}>24/7</h2>
                            </div>
                            {scheduledTasks.map(task => (
                                <div key={task.id} style={{height: '4rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', borderTop: '1px solid #e5e7eb'}}>
                                    <input type="text" value={task.name} onChange={(e) => handleTaskUpdate(task.id, 'name', e.target.value)} style={{gridColumn: 'span 2', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db'}} />
                                    <input type="number" value={task.durationDays} onChange={(e) => handleTaskUpdate(task.id, 'durationDays', e.target.value)} style={{width: '100%', textAlign: 'center', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db'}} />
                                    <input type="number" step="0.5" value={task.durationHours} onChange={(e) => handleTaskUpdate(task.id, 'durationHours', e.target.value)} style={{width: '100%', textAlign: 'center', padding: '0.25rem', borderRadius: '0.375rem', border: '1px solid #d1d5db'}} />
                                    <div style={{display: 'flex', justifyContent: 'center'}}>
                                       <input type="checkbox" checked={task.is247} onChange={() => handleTaskUpdate(task.id, 'is247')} style={{height: '1.25rem', width: '1.25rem', borderRadius: '0.25rem', border: '1px solid #d1d5db'}} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{width: '66.666667%'}}>
                            {/* ... Timeline rendering ... */}
                            <div style={{height: '5rem', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#f3f4f6'}}>
                                {/* ... Timeline header ... */}
                            </div>
                            <div style={{position: 'relative'}}>
                                {scheduledTasks.map((task, index) => {
                                    const startOffset = task.start ? (task.start.getTime() - chartStartDate.getTime()) / totalDuration * 100 : 0;
                                    const width = task.start && task.end ? (task.end.getTime() - task.start.getTime()) / totalDuration * 100 : 0;
                                    return (
                                        <div key={task.id} style={{height: '4rem', borderTop: '1px solid #e5e7eb', position: 'relative', display: 'flex', alignItems: 'center', padding: '0 0.25rem'}}>
                                            <div style={{position: 'absolute', height: '2.5rem', borderRadius: '0.375rem', left: `${startOffset}%`, width: `${width}%`, backgroundColor: colors[index % colors.length]}}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Mount the App to the DOM ---
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

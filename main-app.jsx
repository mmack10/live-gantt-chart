import React, { useState, useMemo, useEffect, useRef } from 'react';

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
    if (dayOfWeek === 6) { nextDay.setDate(nextDay.getDate() + 2); }
    else if (dayOfWeek === 0) { nextDay.setDate(nextDay.getDate() + 1); }
    return nextDay;
};

// --- SVG Icons for UI ---
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>);

// --- Initial Data ---
const initialTasksData = [
    { id: 1, name: 'Phase 1: Pre-production', durationDays: 0, durationHours: 0, leadTimeDays: 2, is247: false, rate: 25000, children: [
        { id: 11, name: 'Site Survey', durationDays: 1, durationHours: 8, leadTimeDays: 0, is247: false, rate: 1500, children: [], resources: [{id: 104, name: 'Inspector', rate: 110, cost: 75}], isExpanded: true, scheduleMode: 'sequential' },
        { id: 12, name: 'Permit Application', durationDays: 3, durationHours: 8, leadTimeDays: 0, is247: false, rate: 10000, children: [], resources: [{id: 105, name: 'Legal Team', rate: 300, cost: 220}], isExpanded: true, scheduleMode: 'concurrent' },
    ], resources: [{id: 101, name: 'Project Manager', rate: 150, cost: 90}], isExpanded: true, scheduleMode: 'sequential' },
    { id: 2, name: 'Phase 2: Execution', durationDays: 0, durationHours: 0, leadTimeDays: 1, is247: false, rate: 150000, children: [], resources: [], isExpanded: true, scheduleMode: 'sequential' },
];

// --- Resource Allocation Modal Component ---
const ResourceModal = ({ task, availableResources, onSave, onClose, onUpdateAvailableResources }) => {
    const [assigned, setAssigned] = useState([...task.resources]);
    const [newResource, setNewResource] = useState({ name: '', rate: '', cost: '' });

    const unassignedResources = availableResources.filter(r => !assigned.find(a => a.name === r.name));

    const assignResource = (resource) => {
        setAssigned([...assigned, { ...resource, id: Date.now() }]);
    };

    const unassignResource = (resourceId) => {
        setAssigned(assigned.filter(r => r.id !== resourceId));
    };

    const handleAddNewResource = () => {
        if (newResource.name && !availableResources.find(r => r.name === newResource.name)) {
            onUpdateAvailableResources([...availableResources, { ...newResource, id: Date.now() }]);
            setNewResource({ name: '', rate: '', cost: '' });
        }
    };
    
    const handleSave = () => {
        onSave(task.id, assigned);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-4xl">
                <h2 className="text-2xl font-bold mb-4">Manage Resources for: {task.name}</h2>
                <div className="grid grid-cols-2 gap-4 h-64">
                    <div className="border rounded-lg p-2 flex flex-col">
                        <h3 className="font-semibold mb-2 text-center">Assigned Resources ({assigned.length})</h3>
                        <ul className="overflow-y-auto flex-grow">
                            {assigned.map(res => (
                                <li key={res.id} onClick={() => unassignResource(res.id)} className="p-2 my-1 bg-blue-100 rounded cursor-pointer hover:bg-red-200 transition-colors">{res.name}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="border rounded-lg p-2 flex flex-col">
                        <h3 className="font-semibold mb-2 text-center">Available Resources ({unassignedResources.length})</h3>
                        <ul className="overflow-y-auto flex-grow">
                            {unassignedResources.map(res => (
                                <li key={res.id} onClick={() => assignResource(res)} className="p-2 my-1 bg-gray-100 rounded cursor-pointer hover:bg-green-200 transition-colors">{res.name}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t">
                    <h3 className="font-semibold mb-2">Add New Resource to Pool</h3>
                    <div className="flex gap-2">
                        <input type="text" value={newResource.name} onChange={(e) => setNewResource({...newResource, name: e.target.value})} className="flex-grow border-gray-300 rounded-md shadow-sm" placeholder="Resource Name"/>
                        <input type="number" value={newResource.rate} onChange={(e) => setNewResource({...newResource, rate: e.target.value})} className="w-24 border-gray-300 rounded-md shadow-sm" placeholder="Rate/hr"/>
                        <input type="number" value={newResource.cost} onChange={(e) => setNewResource({...newResource, cost: e.target.value})} className="w-24 border-gray-300 rounded-md shadow-sm" placeholder="Cost/hr"/>
                        <button onClick={handleAddNewResource} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">Add</button>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [projectTitle, setProjectTitle] = useState('WBS Gantt Chart');
    const [projectSubtitle, setProjectSubtitle] = useState('Financials & Nested Sub-tasks');
    const [projectStartDateInput, setProjectStartDateInput] = useState('2025-07-09');
    const [tasks, setTasks] = useState(initialTasksData);
    const [isExporting, setIsExporting] = useState(false);
    const [viewMode, setViewMode] = useState('default');
    const [areDetailsVisible, setAreDetailsVisible] = useState(true);
    const [draggedItemId, setDraggedItemId] = useState(null);
    const [dropTargetInfo, setDropTargetInfo] = useState(null);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [selectedTaskForResources, setSelectedTaskForResources] = useState(null);
    const [availableResources, setAvailableResources] = useState([
        {id: 101, name: 'Project Manager', rate: 150, cost: 90},
        {id: 102, name: 'Crane', rate: 250, cost: 180},
        {id: 103, name: 'Welder', rate: 95, cost: 60},
        {id: 104, name: 'Inspector', rate: 110, cost: 75},
        {id: 105, name: 'Legal Team', rate: 300, cost: 220},
    ]);
    const chartRef = useRef();

    // --- Load External Scripts ---
    useEffect(() => { /* ... existing handler ... */ }, []);

    // --- Recursive Scheduling & Financial Logic (Immutable) ---
    const scheduledTasks = useMemo(() => {
        const calculateSchedules = (taskList, overallStartDate) => {
            let lastSequentialEndDate = new Date(overallStartDate);
            let lastConcurrentStartDate = new Date(overallStartDate);
            
            return taskList.map((task, index) => {
                let taskStart, workStart, taskEnd;
                const durationDays = parseInt(task.durationDays, 10) || 0;
                const durationHours = parseFloat(task.durationHours) || 0;
                const leadTimeDays = parseInt(task.leadTimeDays, 10) || 0;
                const rate = parseFloat(task.rate) || 0;

                const prevTask = taskList[index - 1];
                if (index > 0 && task.scheduleMode === 'concurrent' && prevTask) {
                    taskStart = new Date(lastConcurrentStartDate);
                } else {
                    taskStart = new Date(lastSequentialEndDate);
                }
                
                if (!task.is247) {
                    if (index === 0 || task.scheduleMode !== 'concurrent') {
                         taskStart = getNextWorkday(taskStart);
                         if (lastSequentialEndDate.getDay() > 0 && lastSequentialEndDate.getDay() < 6 && lastSequentialEndDate.getDate() === taskStart.getDate() && lastSequentialEndDate.getHours() > 7) {
                             taskStart = new Date(lastSequentialEndDate);
                        } else {
                             taskStart.setHours(7, 0, 0, 0);
                        }
                    }
                }
                
                lastConcurrentStartDate = new Date(taskStart);
                workStart = new Date(taskStart);
                if (leadTimeDays > 0) {
                    workStart.setDate(workStart.getDate() + leadTimeDays);
                }

                let scheduledChildren = [];
                let totalChildCost = 0;
                if (task.children && task.children.length > 0) {
                    scheduledChildren = calculateSchedules(task.children, workStart);
                    if (scheduledChildren.length > 0) {
                        const childEndTimes = scheduledChildren.map(c => c.end.getTime());
                        taskEnd = new Date(Math.max(...childEndTimes));
                        totalChildCost = scheduledChildren.reduce((sum, child) => sum + child.totalCost, 0);
                    } else {
                        taskEnd = workStart;
                    }
                } else {
                     if (task.is247) {
                        taskEnd = new Date(workStart);
                        taskEnd.setDate(taskEnd.getDate() + durationDays);
                        taskEnd.setHours(taskEnd.getHours() + durationHours);
                    } else {
                        if (durationDays > 0) {
                            const taskEndDay = addWorkingDays(workStart, durationDays - 1);
                            taskEnd = new Date(taskEndDay);
                            taskEnd.setHours(7, 0, 0, 0);
                            taskEnd.setHours(taskEnd.getHours() + durationHours);
                        } else {
                            taskEnd = new Date(workStart);
                            taskEnd.setHours(taskEnd.getHours() + durationHours);
                        }
                    }
                }
                
                const totalHours = (durationDays * durationHours) + (durationDays === 0 ? durationHours : 0);
                const resourceCost = (task.resources || []).reduce((sum, res) => sum + (parseFloat(res.cost) || 0) * totalHours, 0);
                const totalCost = resourceCost + totalChildCost;
                const profit = rate - totalCost;
                const margin = rate > 0 ? (profit / rate) * 100 : 0;

                if (task.scheduleMode === 'sequential') {
                    lastSequentialEndDate = taskEnd;
                }

                return { ...task, start: taskStart, workStart: workStart, end: taskEnd, children: scheduledChildren, totalCost, profit, margin };
            });
        };

        if (tasks.length === 0) return [];
        const projectStartDate = new Date(`${projectStartDateInput}T07:00:00`);
        return calculateSchedules(tasks, projectStartDate);
    }, [tasks, projectStartDateInput]);


    // --- Handlers ---
    const updateItem = (id, field, value) => {
        const updateRecursively = (items) => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, [field]: value };
                }
                if (item.children && item.children.length > 0) {
                    return { ...item, children: updateRecursively(item.children) };
                }
                return item;
            });
        };
        setTasks(updateRecursively(tasks));
    };
    
    const handleResourceSave = (taskId, newResources) => {
        updateItem(taskId, 'resources', newResources);
    };

    const handleAddTask = () => {
        const newTask = { id: Date.now(), name: 'New Task', durationDays: 1, durationHours: 8, leadTimeDays: 0, is247: false, rate: 0, children: [], resources: [], isExpanded: true, scheduleMode: 'sequential' };
        setTasks(prevTasks => [...prevTasks, newTask]);
    };

    const addSubItem = (parentId) => {
        const newItem = { id: Date.now(), name: 'New Sub-task', durationDays: 1, durationHours: 8, leadTimeDays: 0, is247: false, rate: 0, children: [], resources: [], isExpanded: true, scheduleMode: 'sequential' };
        const addRecursively = (items) => {
            return items.map(item => {
                if (item.id === parentId) {
                    return { ...item, children: [...(item.children || []), newItem] };
                }
                if (item.children && item.children.length > 0) {
                    return { ...item, children: addRecursively(item.children) };
                }
                return item;
            });
        };
        setTasks(addRecursively(tasks));
    };
    
    const removeItem = (idToRemove) => {
        const removeRecursively = (items) => {
            let filteredList = items.filter(t => t.id !== idToRemove);
            return filteredList.map(t => ({ ...t, children: t.children ? removeRecursively(t.children) : [] }));
        };
        setTasks(removeRecursively(tasks));
    };

    const openResourceModal = (task) => {
        setSelectedTaskForResources(task);
        setIsResourceModalOpen(true);
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e, id) => { setDraggedItemId(id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e, targetId) => { e.preventDefault(); setDropTargetInfo({ targetId }); };
    const handleDrop = (e) => {
        e.preventDefault();
        if (!dropTargetInfo || draggedItemId === dropTargetInfo.targetId) {
            setDraggedItemId(null); setDropTargetInfo(null); return;
        }

        let draggedItem;
        const removeRecursively = (taskList) => {
            return taskList.filter(task => {
                if (task.id === draggedItemId) {
                    draggedItem = task;
                    return false;
                }
                return true;
            });
        };
        
        let newTasks = removeRecursively(tasks);

        const insertIndex = newTasks.findIndex(t => t.id === dropTargetInfo.targetId);
        if (insertIndex !== -1) {
            newTasks.splice(insertIndex, 0, draggedItem);
        } else {
            newTasks.push(draggedItem);
        }

        setTasks(newTasks);
        setDraggedItemId(null);
        setDropTargetInfo(null);
    };

    // --- PDF Export Handler ---
    const handleExportPDF = () => { /* ... existing handler ... */ };

    // --- Memoized Values for Rendering ---
    const flattenedItems = useMemo(() => {
        const allItems = [];
        const flatten = (taskList, level) => {
            taskList.forEach(task => {
                allItems.push({ ...task, level, itemType: 'task' });
                if (task.isExpanded) {
                    if (task.children) {
                        flatten(task.children, level + 1);
                    }
                }
            });
        };
        flatten(scheduledTasks, 0);
        return allItems;
    }, [scheduledTasks]);

    const { chartStartDate, chartEndDate, totalDuration } = useMemo(() => {
        if (flattenedItems.length === 0) {
            const start = new Date(); const end = new Date(); end.setDate(start.getDate() + 7);
            return { chartStartDate: start, chartEndDate: end, totalDuration: end - start };
        }
        const taskItems = flattenedItems.filter(item => item.itemType === 'task');
        const startTimes = taskItems.filter(t=>t.start).map(t => t.start.getTime());
        const endTimes = taskItems.filter(t=>t.end).map(t => t.end.getTime());

        if(startTimes.length === 0) return { chartStartDate: new Date(), chartEndDate: new Date(), totalDuration: 1};

        const d_start = new Date(Math.min(...startTimes));
        d_start.setDate(d_start.getDate() - 2);
        const d_end = new Date(Math.max(...endTimes));
        d_end.setDate(d_end.getDate() + 2);
        return { chartStartDate: d_start, chartEndDate: d_end, totalDuration: d_end.getTime() - d_start.getTime() };
    }, [flattenedItems]);
    
    const timelineHeader = useMemo(() => {
        const months = [];
        let currentDate = new Date(chartStartDate);
        while (currentDate <= chartEndDate) {
            const month = currentDate.toLocaleString('default', { month: 'long' });
            const year = currentDate.getFullYear();
            const monthYear = `${month} ${year}`;
            let monthObj = months.find(m => m.name === monthYear);
            if (!monthObj) { monthObj = { name: monthYear, days: [] }; months.push(monthObj); }
            monthObj.days.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return months;
    }, [chartStartDate, chartEndDate]);

    const formatDate = (date) => date ? date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : '';
    const colors = ['bg-blue-400', 'bg-cyan-400', 'bg-teal-400', 'bg-green-400', 'bg-lime-400', 'bg-yellow-400', 'bg-orange-400', 'bg-red-400', 'bg-indigo-400'];

    const ItemRow = ({ item, isVisible, onUpdate, onAddItem, onRemove, onOpenResourceModal, onDragStart, onDragOver, onDragEnd, dropTargetInfo }) => {
        const isDropTarget = dropTargetInfo && dropTargetInfo.targetId === item.id;
        const isDraggable = item.level === 0;
        const hasChildren = item.children && item.children.length > 0;

        return (
            <div>
                <div onDragOver={(e) => onDragOver(e, item.id)} className={`h-1 ${isDropTarget ? 'bg-blue-300' : ''}`}></div>
                <div
                    draggable={isDraggable}
                    onDragStart={isDraggable ? (e) => onDragStart(e, item.id) : undefined}
                    onDragEnd={onDragEnd}
                    className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-1 sm:p-2 border-t border-gray-200 text-sm ${isDraggable ? 'cursor-grab' : ''}`}
                    style={{ paddingLeft: `${item.level * 2 + 0.5}rem` }}
                >
                    <div className={`flex items-center ${isVisible ? 'col-span-3' : 'col-span-12'}`}>
                        <button onClick={() => onUpdate(item.id, 'isExpanded', !item.isExpanded)} className="mr-2 text-gray-500 hover:text-gray-900">
                            {item.children?.length > 0 ? (item.isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />) : <span className="w-4 inline-block"></span>}
                        </button>
                        <input type="text" value={item.name} onChange={(e) => onUpdate(item.id, 'name', e.target.value)} className="font-medium bg-transparent rounded-md p-1 w-full h-10" />
                    </div>
                    {isVisible && (
                        <>
                            <div className="col-span-2 flex justify-center">
                                <select value={item.scheduleMode} onChange={(e) => onUpdate(item.id, 'scheduleMode', e.target.value)} className="bg-gray-100/50 rounded-md border-gray-300 p-1 w-full h-10 text-xs">
                                    <option value="sequential">Sequential</option>
                                    <option value="concurrent">Concurrent</option>
                                </select>
                            </div>
                            <input type="number" value={item.leadTimeDays} onChange={(e) => onUpdate(item.id, 'leadTimeDays', e.target.value)} className="font-medium bg-gray-100/50 rounded-md border-gray-300 p-1 w-full text-center h-10" disabled={hasChildren} />
                            <input type="number" value={item.durationDays} onChange={(e) => onUpdate(item.id, 'durationDays', e.target.value)} className="font-medium bg-gray-100/50 rounded-md border-gray-300 p-1 w-full text-center h-10" disabled={hasChildren} />
                            <input type="number" step="0.5" value={item.durationHours} onChange={(e) => onUpdate(item.id, 'durationHours', e.target.value)} className="font-medium bg-gray-100/50 rounded-md border-gray-300 p-1 w-full text-center h-10" disabled={hasChildren} />
                            <input type="number" value={item.rate} onChange={(e) => onUpdate(item.id, 'rate', e.target.value)} className="font-medium bg-gray-100/50 rounded-md border-gray-300 p-1 w-full text-center h-10" />
                            <div className="text-center font-medium">${item.totalCost?.toFixed(2) || '0.00'}</div>
                            <div className="text-center font-medium">${item.profit?.toFixed(2) || '0.00'}</div>
                            <div className="text-center font-medium">{item.margin?.toFixed(1) || '0.0'}%</div>
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => onAddItem(item.id)} className="text-green-500 font-bold text-lg hover:text-green-700" title="Add Sub-task">+</button>
                                <button onClick={() => onOpenResourceModal(item)} className="text-blue-500 font-bold text-sm hover:text-blue-700" title="Manage Resources">R</button>
                                <button onClick={() => onRemove(item.id)} className="text-red-500 font-bold text-lg hover:text-red-700">x</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen p-2 sm:p-4 lg:p-6 font-sans flex flex-col">
            {isResourceModalOpen && selectedTaskForResources && (
                <ResourceModal 
                    task={selectedTaskForResources}
                    availableResources={availableResources}
                    onClose={() => setIsResourceModalOpen(false)}
                    onSave={handleResourceSave}
                    onUpdateAvailableResources={setAvailableResources}
                />
            )}
            <header className="mb-4">
                 <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <img src="https://storage.googleapis.com/gemini-prod-us-west1-assets/e6558c38a2b53351_Vertexlogo-inv.png" alt="Vertex Logo" className="h-12 hidden sm:block" />
                        <div>
                            <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 w-full" />
                            <input type="text" value={projectSubtitle} onChange={(e) => setProjectSubtitle(e.target.value)} className="text-sm sm:text-base text-gray-500 mt-1 bg-transparent border-none focus:ring-0 p-0 w-full" />
                        </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                            <label htmlFor="startDate" className="font-semibold text-gray-600 text-sm">Start:</label>
                            <input type="date" id="startDate" value={projectStartDateInput} onChange={(e) => setProjectStartDateInput(e.target.value)} className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1" />
                        </div>
                        <button onClick={() => setViewMode(viewMode === 'fit' ? 'default' : 'fit')} className="bg-purple-600 text-white font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm">Fit to Screen</button>
                        <button onClick={handleExportPDF} disabled={isExporting} className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-wait transition-colors flex items-center gap-2 text-sm">{isExporting ? '...' : 'Export PDF'}</button>
                    </div>
                </div>
            </header>

            <div ref={chartRef} className="flex-grow overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
                <div className={`flex ${viewMode === 'fit' ? 'w-full' : 'min-w-[2200px]'}`}>
                    <div className={`${areDetailsVisible ? 'w-3/4 min-w-[1200px]' : 'w-1/3 min-w-[400px]'} border-r border-gray-200 sticky left-0 bg-white z-20 flex flex-col`}>
                        <div className="h-20 grid grid-cols-12 gap-2 items-center p-2 bg-gray-100/70 sticky top-0 text-xs sm:text-sm">
                            <div className={`flex justify-between items-center ${areDetailsVisible ? 'col-span-3' : 'col-span-12'}`}>
                                <h2 className="font-semibold text-gray-700 pl-2">Task Name</h2>
                                <button onClick={() => setAreDetailsVisible(!areDetailsVisible)} className="bg-gray-200 text-gray-600 font-bold p-1 rounded-md hover:bg-gray-300 text-xs mr-2">{areDetailsVisible ? 'Hide' : 'Show'}</button>
                            </div>
                            {areDetailsVisible && (
                                <>
                                    <h2 className="font-semibold text-gray-700 text-center col-span-2">Mode</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Lead</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Days</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Shift Hrs</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Rate</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Cost</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Profit</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Margin</h2>
                                    <h2 className="font-semibold text-gray-700 text-center">Actions</h2>
                                </>
                            )}
                        </div>
                        <div className="flex-grow" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            {flattenedItems.map((item) => (
                                <ItemRow key={item.id} item={item} isVisible={areDetailsVisible} onUpdate={updateItem} onAddItem={addSubItem} onRemove={removeItem} onOpenResourceModal={openResourceModal} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={() => setDropTargetInfo(null)} dropTargetInfo={dropTargetInfo}/>
                            ))}
                             <div onDragOver={(e) => handleDragOver(e, null)} className={`h-1 ${dropTargetInfo && dropTargetInfo.targetId === null ? 'bg-blue-300' : ''}`}></div>
                        </div>
                        <div className="p-2 border-t border-gray-200">
                             <button onClick={handleAddTask} className="w-full bg-green-500 text-white font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm">+ Add Task</button>
                        </div>
                    </div>

                    <div className="flex-grow">
                        <div className="h-20 bg-gray-100/70 sticky top-0 z-10">
                             <div className="flex h-full">
                                {timelineHeader.map(month => (
                                    <div key={month.name} style={{ width: `${(month.days.length / ((chartEndDate - chartStartDate) / (1000 * 60 * 60 * 24))) * 100}%` }} className="flex flex-col border-l border-gray-200">
                                        <div className="h-1/2 flex items-center justify-center border-b border-gray-200"><span className="font-semibold text-gray-600 text-xs sm:text-sm">{month.name}</span></div>
                                        <div className="h-1/2 flex">{month.days.map(day => (<div key={day.getTime()} className={`flex-1 flex items-center justify-center border-r border-gray-200 ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-200/50' : ''}`}><span className="text-xs text-gray-500">{day.getDate()}</span></div>))}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            {flattenedItems.map((item, index) => {
                                if (item.itemType === 'resource' || !item.start || !item.end) return null;
                                const topPosition = index * 2.3;
                                
                                const leadTimeDuration = item.workStart.getTime() - item.start.getTime();
                                const workDuration = item.end.getTime() - item.workStart.getTime();

                                const leadTimeOffset = (item.start.getTime() - chartStartDate.getTime()) / totalDuration * 100;
                                const leadTimeWidth = leadTimeDuration / totalDuration * 100;

                                const workOffset = (item.workStart.getTime() - chartStartDate.getTime()) / totalDuration * 100;
                                const workWidth = workDuration / totalDuration * 100;

                                return (
                                    <div key={item.id} className="h-9 absolute w-full" style={{ top: `${topPosition}rem` }}>
                                        <div className="group absolute h-8" style={{ top: '0.125rem', left: `${leadTimeOffset}%`, width: `${leadTimeWidth + workWidth}%` }}>
                                            {leadTimeWidth > 0 && (
                                                <div className={`absolute h-full ${colors[item.level % colors.length]} opacity-30 rounded-l-md`} style={{ width: `${(leadTimeWidth / (leadTimeWidth + workWidth)) * 100}%`, left: 0 }}></div>
                                            )}
                                            <div className={`absolute h-full ${colors[item.level % colors.length]} ${leadTimeWidth > 0 ? 'rounded-r-md' : 'rounded-md'}`} style={{ width: `${(workWidth / (leadTimeWidth + workWidth)) * 100}%`, right: 0 }}></div>
                                             <div className="absolute bottom-full mb-2 w-max max-w-xs p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30 left-1/2 -translate-x-1/2">
                                                 <p className="font-bold">{item.name}</p>
                                                 <p><strong>Start:</strong> {formatDate(item.start)}</p><p><strong>End:</strong> {formatDate(item.end)}</p>
                                             </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

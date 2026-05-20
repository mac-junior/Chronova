import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import { ErrorIcon, toast } from "react-hot-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
    LogOut, Plus, CheckCircle, Circle, Clock3, Trash2, Calendar, Clock,
    AlertCircle, Sun, Sunrise, Sunset, Moon, BarChart2, ListTodo,
    Loader2, CheckSquare, Hourglass, Search, SlidersHorizontal,
    ChevronLeft, ChevronRight, LayoutDashboard, Bell, FilePlus2,
    ListChecks, Menu, X, Check, Mail, Info, Volume2, VolumeX, Edit3
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

dayjs.extend(relativeTime);
dayjs.extend(duration);

// SUB-COMPONENT: REAL-TIME PRECISION COUNTDOWN TIMER CLOCK
const TaskCountdown = ({ dueDate, completed }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        if (completed) {
            setTimeLeft("Completed");
            return;
        }

        const calculateTime = () => {
            const now = dayjs();
            const target = dayjs(dueDate);
            const diffMs = target.diff(now);

            if (diffMs <= 0) {
                setTimeLeft("Time is up!");
                setIsOverdue(true);
                return;
            }

            const dur = dayjs.duration(diffMs);
            const days = Math.floor(dur.asDays());
            const hours = dur.hours();
            const mins = dur.minutes();
            const secs = dur.seconds();

            let timeString = "";
            if (days > 0) timeString += `${days}d `;
            if (days > 0 || hours > 0) timeString += `${hours}h `;
            timeString += `${mins}m ${secs}s`;

            setTimeLeft(timeString);
            setIsOverdue(false);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [dueDate, completed]);

    if (completed) return <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">Resolved</span>;

    return (
        <span className={`px-2 py-0.5 rounded font-mono tracking-tight font-semibold flex items-center gap-1 text-[10px] ${isOverdue ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-zinc-800 text-indigo-400"
            }`}>
            <Clock3 className="w-2.5 h-2.5" />
            {timeLeft}
        </span>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [greeting, setGreeting] = useState({ text: "", icon: null });

    // Offline Local Audio Engine Parameters
    const [activeAlarmTask, setActiveAlarmTask] = useState(null);
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const alarmAudioRef = useRef(null);

    // Form DOM Input Reference Pointer Coordinates for Active Icon Clicks
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);
    const editDateInputRef = useRef(null);
    const editTimeInputRef = useRef(null);

    // Dashboard Viewport State Parameters
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("All");
    const [activeTab, setActiveTab] = useState("overview");

    // FORM MODAL CONTROL INTERACTION TRACKERS
    const [editingTask, setEditingTask] = useState(null);
    const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
    const [confirmUpdateOpen, setConfirmUpdateOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

    // Form Control States
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        priority: "Medium"
    });

    useEffect(() => {
        const updateGreeting = () => {
            const hour = dayjs().hour();
            if (hour >= 5 && hour < 12) {
                setGreeting({ text: "Good morning", icon: <Sunrise className="w-5 h-5 text-amber-400" /> });
            } else if (hour >= 12 && hour < 17) {
                setGreeting({ text: "Good afternoon", icon: <Sun className="w-5 h-5 text-amber-500" /> });
            } else if (hour >= 17 && hour < 21) {
                setGreeting({ text: "Good evening", icon: <Sunset className="w-5 h-5 text-orange-400" /> });
            } else {
                setGreeting({ text: "Good night", icon: <Moon className="w-5 h-5 text-indigo-400" /> });
            }
        };
        updateGreeting();
        fetchTasks();

        alarmAudioRef.current = new Audio("/alarm-ring.mp3");
        alarmAudioRef.current.loop = true;

        return () => {
            if (alarmAudioRef.current) {
                alarmAudioRef.current.pause();
            }
        };
    }, []);

    // LIVE ALARM MONITOR SENTINEL ENGINE - SCANS REAL TIME DIFFERENCES EVERY 1 SECOND
    useEffect(() => {
        if (tasks.length === 0 || activeAlarmTask) return;

        const checkAlarmTrigger = setInterval(() => {
            const now = dayjs();

            const taskToRing = tasks.find(t => {
                // ✅ Alarm ONLY triggers for incomplete tasks that are overdue
                if (t.completed || t.isAlarmDismissed) return false;
                const taskTime = dayjs(t.dueDate);
                return now.isAfter(taskTime) || now.isSame(taskTime, "second");
            });

            if (taskToRing) {
                setActiveAlarmTask(taskToRing);
                if (alarmAudioRef.current) {
                    alarmAudioRef.current.play()
                        .then(() => setIsAudioUnlocked(true))
                        .catch(err => console.log("Audio play deferred by browser policy configurations:", err));
                }
            }
        }, 1000);

        return () => clearInterval(checkAlarmTrigger);
    }, [tasks, activeAlarmTask]);

    const handleTabSelection = (tabId) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
    };

    const handleUnlockAudioEngine = () => {
        if (alarmAudioRef.current) {
            alarmAudioRef.current.play()
                .then(() => {
                    alarmAudioRef.current.pause();
                    alarmAudioRef.current.currentTime = 0;
                    setIsAudioUnlocked(true);
                    toast.success("Chronova Audio Engine Active & Secure!");
                })
                .catch(err => console.error("Audio engine authorization error:", err));
        }
    };

    const handleDismissAlarm = () => {
        if (alarmAudioRef.current) {
            alarmAudioRef.current.pause();
            alarmAudioRef.current.currentTime = 0;
        }
        setTasks(prev => prev.map(t => (t._id === activeAlarmTask._id || t.id === activeAlarmTask.id) ? { ...t, isAlarmDismissed: true } : t));
        setActiveAlarmTask(null);
        setIsAudioUnlocked(false);  // Add this line - resets audio so button reappears
        toast.success("Alarm ringtone silenced safely.");
    };

    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");
            setTasks(Array.isArray(response.data) ? response.data : response.data.tasks || []);
        } catch (error) {
            console.error("Task synchronization channel fault:", error);
            toast.error("Failed to load your schedules correctly");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // TRIGGER MODAL VALIDATION INSTEAD OF DIRECT API POST INGESTION
    const handlePreCheckCreateTask = (e) => {
        e.preventDefault();
        const combinedDateTime = dayjs(`${formData.dueDate} ${formData.dueTime}`);
        if (combinedDateTime.isBefore(dayjs())) {
            toast.error("Invalid Configuration: Deadlines must reside in future timelines.");
            return;
        }
        setConfirmCreateOpen(true);
    };

    const handleCreateTaskExecution = async () => {
        setConfirmCreateOpen(false);
        setSubmitting(true);
        const combinedDateTime = dayjs(`${formData.dueDate} ${formData.dueTime}`).toISOString();

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                dueDate: combinedDateTime,
                priority: formData.priority
            };

            const response = await api.post("/tasks", payload);
            const newTask = response.data.task || response.data;

            setTasks([newTask, ...tasks]);
            setFormData({ title: "", description: "", dueDate: "", dueTime: "", priority: "Medium" });
            toast.success("Task scheduled successfully! Email reminder armed.");
            setActiveTab("tasks");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not generate task event");
        } finally {
            setSubmitting(false);
        }
    };

    // TASK EDIT MODAL PROCESSING UTILITIES
    const handleInitiateEdit = (task) => {
        // ✅ If task is completed, do not allow editing
        if (task.completed) {
            toast.error("Completed tasks cannot be edited.");
            return;
        }
        const datePart = dayjs(task.dueDate).format("YYYY-MM-DD");
        const timePart = dayjs(task.dueDate).format("HH:mm");
        setEditingTask({
            id: task._id || task.id,
            title: task.title,
            description: task.description || "",
            dueDate: datePart,
            dueTime: timePart,
            priority: task.priority || "Medium"
        });
    };

    const handleUpdateTaskInputChange = (e) => {
        setEditingTask({ ...editingTask, [e.target.name]: e.target.value });
    };

    const handlePreCheckUpdateTask = (e) => {
        e.preventDefault();
        const combinedDateTime = dayjs(`${editingTask.dueDate} ${editingTask.dueTime}`);
        if (combinedDateTime.isBefore(dayjs())) {
            toast.error("Invalid Configuration: Updated targets must stay inside future timelines.");
            return;
        }
        setConfirmUpdateOpen(true);
    };

    const handleUpdateTaskExecution = async () => {
        setConfirmUpdateOpen(false);
        setSubmitting(true);
        const combinedDateTime = dayjs(`${editingTask.dueDate} ${editingTask.dueTime}`).toISOString();

        try {
            const payload = {
                title: editingTask.title,
                description: editingTask.description,
                dueDate: combinedDateTime,
                priority: editingTask.priority
            };

            const response = await api.put(`/tasks/${editingTask.id}`, payload);
            const updatedRecord = response.data.task || response.data;

            setTasks(tasks.map(t => (t._id === editingTask.id || t.id === editingTask.id) ? {
                ...t,
                title: updatedRecord.title,
                description: updatedRecord.description,
                dueDate: updatedRecord.dueDate,
                priority: updatedRecord.priority,
                isAlarmDismissed: false
            } : t));

            setEditingTask(null);
            toast.success("Task modifications written successfully.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Could not save task modifications");
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ FIXED: Mark as completed only - NO un-completing
    const handleToggleComplete = async (id, currentStatus) => {
        // If it's already completed, don't allow un-completing
        if (currentStatus) {
            toast.error("Completed tasks cannot be restored. Please delete and recreate if needed.");
            return;
        }

        try {
            const response = await api.put(`/tasks/${id}`, { completed: true });
            const updated = response.data.task || response.data;
            setTasks(tasks.map(t => (t._id === id || t.id === id) ? { ...t, completed: updated.completed } : t));

            // Dismiss alarm if this task was triggering it
            if (activeAlarmTask && (activeAlarmTask._id === id || activeAlarmTask.id === id)) {
                handleDismissAlarm();
            }

            toast.success("✅ Task marked as completed! Moved to Completed tab.");
        } catch (error) {
            toast.error("Failed to mark task as completed");
        }
    };

    const handleDeleteTaskExecution = async () => {
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id && t.id !== id));
            if (activeAlarmTask && (activeAlarmTask._id === id || activeAlarmTask.id === id)) {
                handleDismissAlarm();
            }
            toast.success("Task dropped from tracking system");
        } catch (error) {
            toast.error("Failed to delete task from server instance");
        }
    };

    // ✅ FIXED: Correct endpoint for deleting all tasks
    const handleClearAllTasksExecution = async () => {
        setConfirmDeleteAllOpen(false);
        try {
            await api.delete("/tasks/delete/all");
            setTasks([]);
            if (activeAlarmTask) handleDismissAlarm();
            toast.success("All task logs cleared successfully.");
        } catch (error) {
            console.error("Clear all tasks error:", error);
            toast.error(error.response?.data?.message || "Failed to clear task logs.");
        }
    };

    // Metrics Parameters Evaluator
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const overdueCount = tasks.filter(t => !t.completed && dayjs(t.dueDate).isBefore(dayjs())).length;
    const pendingCount = totalCount - completedCount - overdueCount;

    const activeRemindersList = tasks.filter(t => !t.completed);
    const unreadRemindersCount = tasks.filter(t => !t.completed && t.isReminderSent).length;

    // ✅ My Tasks = only incomplete tasks (including overdue)
    const incompleteTasks = tasks.filter(task => !task.completed);
    const filteredIncompleteTasks = incompleteTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPriority = selectedPriority === "All" || task.priority?.toLowerCase() === selectedPriority.toLowerCase();
        return matchesSearch && matchesPriority;
    });

    // ✅ Completed Tasks = only completed tasks
    const completedTasksList = tasks.filter(task => task.completed);
    const filteredCompletedTasks = completedTasksList.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPriority = selectedPriority === "All" || task.priority?.toLowerCase() === selectedPriority.toLowerCase();
        return matchesSearch && matchesPriority;
    });

    const chartData = [
        { name: "Pending", value: pendingCount, color: "#f59e0b" },
        { name: "Overdue Alerts", value: overdueCount, color: "#ef4444" },
        { name: "Completed Tasks", value: completedCount, color: "#10b981" }
    ].filter(d => d.value > 0);

    // ✅ Added "Completed" tab to sidebar
    const sidebarItems = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "create", label: "Create Task", icon: <FilePlus2 className="w-4 h-4" /> },
        { id: "tasks", label: "My Tasks", icon: <ListChecks className="w-4 h-4" />, badge: pendingCount > 0 ? pendingCount : null },
        { id: "completed", label: "Completed", icon: <CheckCircle className="w-4 h-4" />, badge: completedCount > 0 ? completedCount : null },
        { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
        { id: "reminders", label: "Reminders", icon: <Bell className="w-4 h-4" />, badge: unreadRemindersCount > 0 ? unreadRemindersCount : null }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">

            {/* Collapsible Sidebar Component Frame */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 260 : 70 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="hidden md:flex flex-col bg-zinc-900 border-r border-white/5 h-screen sticky top-0 z-50 shrink-0 relative select-none"
            >
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-[24px] -right-[12px] bg-zinc-900 border border-white/10 hover:border-indigo-500/50 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-400 shadow-md transition-all z-50 cursor-pointer"
                    title={isSidebarOpen ? "Collapse Menu" : "Expand Menu"}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                <div className="p-4 border-b border-white/5 flex items-center justify-between overflow-hidden h-[73px]">
                    <div className="flex items-center gap-3 min-w-[180px]">
                        <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-400 shadow-inner">
                            <Clock className="w-4 h-4" />
                        </div>
                        {isSidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent uppercase">
                                    Chronova
                                </span>
                                <span className="text-[10px] text-zinc-500 font-semibold tracking-wider -mt-0.5">
                                    Your Tasks. Your Time.
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-1.5 mt-4">
                    {sidebarItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleTabSelection(item.id)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer group ${activeTab === item.id
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs"
                                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={activeTab === item.id ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}>
                                    {item.icon}
                                </div>
                                {isSidebarOpen && <span>{item.label}</span>}
                            </div>
                            {isSidebarOpen && item.badge && (
                                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${item.id === "reminders" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 overflow-hidden">
                    <button
                        onClick={() => setConfirmLogoutOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition duration-150 group cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* 2. PRIMARY ACTIVE VIEWPORT WORKSPACE */}
            <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">

                {/* Dynamic Navigation Header Segment */}
                <header className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between h-[73px]">
                    <div className="flex items-center gap-3">
                        {/* Mobile Hamburger Menu Toggle Trigger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 -ml-2 rounded-xl border border-white/5 bg-zinc-900 text-zinc-400 hover:text-zinc-200 md:hidden cursor-pointer"
                        >
                            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>

                        <div className="flex items-center gap-2.5">
                            {greeting.icon}
                            <div>
                                <h1 className="text-sm font-semibold tracking-tight text-zinc-200">
                                    {greeting.text}, {user?.username || "Productive User"}
                                </h1>
                                <p className="text-xs text-zinc-500 font-medium">Stay organized. Get things done.</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setConfirmLogoutOpen(true)}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-xs font-medium transition-all bg-zinc-900 cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                    </button>
                </header>

                {/* Global Real-Time Alarm Ring Alert Banner + Autoplay Safety Gate */}
                <AnimatePresence>
                    {!isAudioUnlocked && !activeAlarmTask && (
                        <div className="bg-indigo-500/10 border-b border-indigo-500/20 p-2 text-center text-xs text-indigo-300 flex items-center justify-center gap-2 relative z-50 w-full">
                            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            <span>Audio engine is disabled. Click to re-enable alarm sounds for future deadlines:</span>
                            <button
                                onClick={handleUnlockAudioEngine}
                                className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer text-[10px]"
                            >
                                Reactivate Sound
                            </button>
                        </div>
                    )}
                </AnimatePresence>

                {/* Mobile Flyout Navigation Drawer Panel Element */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden fixed top-[74px] left-0 right-0 bg-zinc-900 border-b border-white/5 z-50 p-4 shadow-2xl flex flex-col gap-1.5"
                        >
                            {sidebarItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabSelection(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTab === item.id
                                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/10"
                                            : "text-zinc-400 hover:bg-white/5"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-zinc-800 text-zinc-400 font-bold">
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                            <div className="pt-3 mt-2 border-t border-white/5">
                                <button
                                    onClick={() => setConfirmLogoutOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/5 cursor-pointer w-full"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout Account Session</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Core Rendering Workspace Matrix */}
                <main className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
                    {loading ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-xs text-zinc-500">Convincing your tasks to behave…</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB A: OVERVIEW MAP */}
                            {activeTab === "overview" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                            <div className="flex justify-between items-start text-zinc-400">
                                                <span className="text-xs font-medium">Total Tasks</span>
                                                <ListTodo className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-4">{totalCount}</h3>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                            <div className="flex justify-between items-start text-amber-400">
                                                <span className="text-xs font-medium text-zinc-400">Active Pending</span>
                                                <Hourglass className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-4 text-amber-400">{pendingCount}</h3>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                            <div className="flex justify-between items-start text-red-400">
                                                <span className="text-xs font-medium text-zinc-400">Overdue Alerts</span>
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-4 text-red-400">{overdueCount}</h3>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
                                            <div className="flex justify-between items-start text-emerald-400">
                                                <span className="text-xs font-medium text-zinc-400">Completed Logs</span>
                                                <CheckSquare className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-bold tracking-tight mt-4 text-emerald-400">{completedCount}</h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-900 border border-white/5 min-h-[280px] flex flex-col justify-between">
                                            <div>
                                                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Productivity Ratios</h2>
                                            </div>
                                            <div className="h-[180px] w-full flex items-center justify-center">
                                                {chartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={chartData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                                                {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.05)" }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <p className="text-xs text-zinc-500">No data models available to graph.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 space-y-4">
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Urgency Distribution</h2>
                                            <div className="space-y-3 pt-1">
                                                {["High", "Medium", "Low"].map((lvl) => {
                                                    const num = tasks.filter(t => t.priority === lvl).length;
                                                    const pct = totalCount > 0 ? (num / totalCount) * 100 : 0;
                                                    return (
                                                        <div key={lvl} className="space-y-1">
                                                            <div className="flex justify-between text-xs"><span className="text-zinc-400">{lvl}</span><span>{num}</span></div>
                                                            <div className="h-1 bg-zinc-950 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB B: CREATE TASK PANEL */}
                            {activeTab === "create" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto p-5 md:p-6 rounded-2xl bg-zinc-900 border border-white/5 space-y-6">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight">Create Task</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Chronova automated cron monitors use these parameters to trigger your notifications.</p>
                                    </div>
                                    <form onSubmit={handlePreCheckCreateTask} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400 font-medium">Task Heading</label>
                                            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="Describe the core objective..." className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-100 placeholder-zinc-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400 font-medium">Context / Notes</label>
                                            <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Specify criteria details or reminder logs..." className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden resize-none text-zinc-200" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Target Date</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        name="dueDate"
                                                        required
                                                        ref={dateInputRef}
                                                        min={dayjs().format("YYYY-MM-DD")}
                                                        value={formData.dueDate}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 pl-9 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300"
                                                    />
                                                    <Calendar
                                                        className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-indigo-400 transition"
                                                        onClick={() => dateInputRef.current?.showPicker()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Exact Due Time</label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        name="dueTime"
                                                        required
                                                        ref={timeInputRef}
                                                        value={formData.dueTime}
                                                        onChange={handleInputChange}
                                                        className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 pl-9 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300"
                                                    />
                                                    <Clock
                                                        className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-indigo-400 transition"
                                                        onClick={() => timeInputRef.current?.showPicker()}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Priority Tier</label>
                                                <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300">
                                                    <option value="Low">Low Priority</option>
                                                    <option value="Medium">Medium Priority</option>
                                                    <option value="High">High Priority</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs p-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>Create Task</span>
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* TAB C: MY TASKS (INCOMPLETE + OVERDUE TASKS ONLY) */}
                            {activeTab === "tasks" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                            <input type="text" placeholder="Filter parameters..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition text-zinc-200 placeholder-zinc-600" />
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            {tasks.length > 0 && (
                                                <button
                                                    onClick={() => setConfirmDeleteAllOpen(true)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-500/10 bg-red-500/5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer shadow-sm shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Clear All Tasks</span>
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                                                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-hidden">
                                                    <option value="All">All Intensities</option>
                                                    <option value="High">High Priority</option>
                                                    <option value="Medium">Medium Priority</option>
                                                    <option value="Low">Low Priority</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <AnimatePresence mode="popLayout">
                                            {filteredIncompleteTasks.map((task) => {
                                                let cardColorClass = "border-white/5 bg-zinc-900";
                                                if (task.priority === "High") {
                                                    cardColorClass = "border-red-500/20 bg-red-950/5 shadow-xs shadow-red-500/2";
                                                } else if (task.priority === "Medium") {
                                                    cardColorClass = "border-amber-500/20 bg-amber-950/5 shadow-xs shadow-amber-500/2";
                                                } else if (task.priority === "Low") {
                                                    cardColorClass = "border-blue-500/20 bg-blue-950/5 shadow-xs shadow-blue-500/2";
                                                }
                                                // Overdue tasks get a special indicator
                                                const isOverdue = !task.completed && dayjs(task.dueDate).isBefore(dayjs());

                                                return (
                                                    <motion.div
                                                        key={task._id || task.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        className={`p-4 rounded-xl border ${cardColorClass} flex items-center justify-between gap-4 cursor-default select-none transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg hover:border-zinc-700 group ${isOverdue ? "border-red-500/30 bg-red-950/10" : ""}`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                                            {/* ✅ FIXED BUTTON: Always shows Circle (no conditional), only marks as completed */}
                                                            <button onClick={() => handleToggleComplete(task._id || task.id, task.completed)} className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition cursor-pointer shrink-0">
                                                                <Circle className="w-4 h-4" />
                                                            </button>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h4 className={`text-xs font-semibold tracking-tight transition ${task.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>{task.title}</h4>
                                                                    <TaskCountdown dueDate={task.dueDate} completed={task.completed} />
                                                                    {isOverdue && !task.completed && (
                                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 animate-pulse">⚠️ OVERDUE</span>
                                                                    )}
                                                                </div>
                                                                {task.description && <p className="text-[11px] text-zinc-500 font-normal mt-0.5 truncate max-w-2xl">{task.description}</p>}
                                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-medium text-zinc-500">
                                                                    <span className={`px-1.5 py-0.5 rounded-md ${task.priority === "High" ? "bg-red-500/10 text-red-400" : task.priority === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{task.priority} Priority</span>
                                                                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{dayjs(task.dueDate).format("MMM DD, YYYY [-] hh:mm A")}</span></div>
                                                                    {task.isReminderSent && <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold"><Mail className="w-2.5 h-2.5" /> Email Sent</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button onClick={() => handleInitiateEdit(task)} className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition cursor-pointer" title="Edit Task Specifications">
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteId(task._id || task.id)} className="sm:opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer" title="Delete Task">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        {filteredIncompleteTasks.length === 0 && (
                                            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                                <p className="text-xs text-zinc-500">No active tasks found. Create a new task or check the Completed tab!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB D: COMPLETED TASKS SECTION */}
                            {activeTab === "completed" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Search completed tasks..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition text-zinc-200 placeholder-zinc-600"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                            {completedTasksList.length > 0 && (
                                                <button
                                                    onClick={() => setConfirmDeleteAllOpen(true)}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-500/10 bg-red-500/5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer shadow-sm shrink-0"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span>Clear All Tasks</span>
                                                </button>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                                                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-hidden">
                                                    <option value="All">All Intensities</option>
                                                    <option value="High">High Priority</option>
                                                    <option value="Medium">Medium Priority</option>
                                                    <option value="Low">Low Priority</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <AnimatePresence mode="popLayout">
                                            {filteredCompletedTasks.map((task) => {
                                                let cardColorClass = "border-emerald-500/20 bg-emerald-950/5 shadow-xs shadow-emerald-500/2";

                                                return (
                                                    <motion.div
                                                        key={task._id || task.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.98 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        className={`p-4 rounded-xl border ${cardColorClass} flex items-center justify-between gap-4 cursor-default select-none transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg hover:border-zinc-700 group`}
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                                            {/* ✅ Completed tasks show check icon but NOT clickable */}
                                                            <div className="mt-0.5 text-emerald-400 shrink-0">
                                                                <CheckCircle className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h4 className="text-xs font-semibold tracking-tight line-through text-zinc-500">{task.title}</h4>
                                                                    <TaskCountdown dueDate={task.dueDate} completed={task.completed} />
                                                                </div>
                                                                {task.description && <p className="text-[11px] text-zinc-500 font-normal mt-0.5 truncate max-w-2xl line-through">{task.description}</p>}
                                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-medium text-zinc-500">
                                                                    <span className={`px-1.5 py-0.5 rounded-md ${task.priority === "High" ? "bg-red-500/10 text-red-400" : task.priority === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{task.priority} Priority</span>
                                                                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{dayjs(task.dueDate).format("MMM DD, YYYY [-] hh:mm A")}</span></div>
                                                                    <div className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /><span>Completed</span></div>
                                                                    {task.isReminderSent && <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold"><Mail className="w-2.5 h-2.5" /> Email Sent</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => handleInitiateEdit(task)}
                                                                className="p-2 text-zinc-500 rounded-lg transition cursor-not-allowed opacity-40"
                                                                title="Completed tasks cannot be edited"
                                                                disabled
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setConfirmDeleteId(task._id || task.id)} className="sm:opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer" title="Delete Task">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                        {filteredCompletedTasks.length === 0 && (
                                            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                                <p className="text-xs text-zinc-500">No completed tasks yet. Mark some tasks as complete to see them here!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB E: SYSTEM PERFORMANCE HISTORICAL ANALYSIS */}
                            {activeTab === "analytics" && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-zinc-900 border border-white/5 space-y-6">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight">Productivity Analysis Log</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Automated workflow telemetry derived directly from database instances.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Completion Ratio</p>
                                            <h4 className="text-2xl font-black tracking-tight text-emerald-400 mt-2">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</h4>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Cron Monitor Node</p>
                                            <h4 className="text-2xl font-black tracking-tight text-indigo-400 mt-2">100% Stable</h4>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Remaining Load</p>
                                            <h4 className="text-2xl font-black tracking-tight text-amber-400 mt-2">{pendingCount + overdueCount} tasks</h4>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB F: REMINDER STATUS SENTINEL MONITOR */}
                            {activeTab === "reminders" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <h2 className="text-sm font-semibold tracking-tight">Active Automation Logs</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Chronova verification records for dispatched or queued alerts.</p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {activeRemindersList.length > 0 ? (
                                            activeRemindersList.map((task) => (
                                                <div key={task._id || task.id} className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3">
                                                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${task.isReminderSent ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                                                        {task.isReminderSent ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <h4 className="text-xs font-semibold text-zinc-200 truncate">{task.title}</h4>
                                                            <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">{dayjs(task.dueDate).fromNow()}</span>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-400 mt-1">
                                                            {task.isReminderSent
                                                                ? `Success: Chronova mailer triggered alerts to user address for execution time ${dayjs(task.dueDate).format("hh:mm A")}.`
                                                                : `Armed: E-mail dispatch is queued to launch on ${dayjs(task.dueDate).format("MMM DD, YYYY [at] hh:mm A")}.`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                                <p className="text-xs text-zinc-500">No active reminder logs found in data models.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ========================================================================= */}
            {/* PROFESSIONAL HIGH-UTILITY CONFIRMATION MODALS AND PORTALS OVERLAYS LAYOUT */}
            {/* ========================================================================= */}
            <AnimatePresence>

                {/* MODAL 1: HIGH-PRECISION INLINE UPDATES FORM PANEL MODAL */}
                {editingTask && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="w-full max-w-lg p-5 md:p-6 rounded-2xl bg-zinc-900 border border-white/5 space-y-5 text-left shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold tracking-tight text-white">Modify Task Specifications</h3>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">Edit information constraints safely inside database indexes.</p>
                                </div>
                                <button type="button" onClick={() => setEditingTask(null)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={handlePreCheckUpdateTask} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400 font-medium">Task Heading</label>
                                    <input type="text" name="title" required value={editingTask.title} onChange={handleUpdateTaskInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-100" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-zinc-400 font-medium">Context / Notes</label>
                                    <textarea name="description" rows="3" value={editingTask.description} onChange={handleUpdateTaskInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden resize-none text-zinc-100" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400 font-medium">Target Date</label>
                                        <div className="relative">
                                            <input type="date" name="dueDate" required ref={editDateInputRef} min={dayjs().format("YYYY-MM-DD")} value={editingTask.dueDate} onChange={handleUpdateTaskInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 pl-9 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300" />
                                            <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-indigo-400 transition" onClick={() => editDateInputRef.current?.showPicker()} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400 font-medium">Exact Due Time</label>
                                        <div className="relative">
                                            <input type="time" name="dueTime" required ref={editTimeInputRef} value={editingTask.dueTime} onChange={handleUpdateTaskInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 pl-9 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300" />
                                            <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-indigo-400 transition" onClick={() => editTimeInputRef.current?.showPicker()} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-zinc-400 font-medium">Priority Tier</label>
                                        <select name="priority" value={editingTask.priority} onChange={handleUpdateTaskInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300">
                                            <option value="Low">Low Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="High">High Priority</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2.5 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition text-xs font-semibold cursor-pointer">Cancel</button>
                                    <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer"><span>Update Specifications</span></button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* MODAL 2: CONFIRMATION LAYER - CREATE TASK ACTION (GREEN SUCCESS OPTION) */}
                {confirmCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm p-5 bg-zinc-900 border border-white/5 rounded-2xl text-center space-y-4 shadow-2xl">
                            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Check className="w-5 h-5" /></div>
                            <div><h3 className="text-sm font-bold text-zinc-100">Are you sure?</h3><p className="text-xs text-zinc-400 mt-1">Confirm deployment of this new scheduled event to backend tracking instances.</p></div>
                            <div className="flex gap-2.5 pt-1"><button onClick={() => setConfirmCreateOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button><button onClick={handleCreateTaskExecution} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer">Create Task</button></div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL 3: CONFIRMATION LAYER - UPDATE TASK ACTION (GREEN SUCCESS OPTION) */}
                {confirmUpdateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm p-5 bg-zinc-900 border border-white/5 rounded-2xl text-center space-y-4 shadow-2xl">
                            <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Check className="w-5 h-5" /></div>
                            <div><h3 className="text-sm font-bold text-zinc-100">Are you sure?</h3><p className="text-xs text-zinc-400 mt-1">This will commit and overwrite records in the database clusters.</p></div>
                            <div className="flex gap-2.5 pt-1"><button onClick={() => setConfirmUpdateOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button><button onClick={handleUpdateTaskExecution} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition cursor-pointer">Update Task</button></div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL 4: CONFIRMATION LAYER - SINGLE DELETE ACTION (RED DANGER OPTION) */}
                {confirmDeleteId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm p-5 bg-zinc-900 border border-red-500/10 rounded-2xl text-center space-y-4 shadow-2xl">
                            <div className="mx-auto w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><Trash2 className="w-5 h-5" /></div>
                            <div><h3 className="text-sm font-bold text-zinc-100">Are you sure?</h3><p className="text-xs text-zinc-400 mt-1">This will permanently drop this single task from memory stores.</p></div>
                            <div className="flex gap-2.5 pt-1"><button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button><button onClick={handleDeleteTaskExecution} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition cursor-pointer">Delete Task</button></div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL 5: CONFIRMATION LAYER - WIPING ENTIRE CATALOG HISTORY (RED DANGER OPTION) */}
                {confirmDeleteAllOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm p-5 bg-zinc-900 border border-red-500/20 rounded-2xl text-center space-y-4 shadow-2xl">
                            <div className="mx-auto w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center"><AlertCircle className="w-5 h-5 animate-pulse" /></div>
                            <div><h3 className="text-sm font-bold text-zinc-100">Are you sure?</h3><p className="text-xs text-zinc-400 mt-1">Critical Intervention: This will permanently wipe out your entire active task catalog history.</p></div>
                            <div className="flex gap-2.5 pt-1"><button onClick={() => setConfirmDeleteAllOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button><button onClick={handleClearAllTasksExecution} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition cursor-pointer">Delete All Tasks</button></div>
                        </motion.div>
                    </div>
                )}

                {/* MODAL 6: CONFIRMATION LAYER - ACCOUNT LOGOUT PROMPT (RED DANGER OPTION) */}
                {confirmLogoutOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm p-5 bg-zinc-900 border border-white/5 rounded-2xl text-center space-y-4 shadow-2xl">
                            <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center"><LogOut className="w-5 h-5" /></div>
                            <div><h3 className="text-sm font-bold text-zinc-100">Are you sure you want to logout?</h3><p className="text-xs text-zinc-400 mt-1">This will drop your current active dashboard session tracks securely.</p></div>
                            <div className="flex gap-2.5 pt-1"><button onClick={() => setConfirmLogoutOpen(false)} className="flex-1 py-2.5 rounded-xl border border-white/5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer">Cancel</button><button onClick={logout} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition cursor-pointer">Logout</button></div>
                        </motion.div>
                    </div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
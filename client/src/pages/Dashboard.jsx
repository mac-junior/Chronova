import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ErrorIcon, toast } from "react-hot-toast";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
    LogOut, Plus, CheckCircle, Circle, Clock3, Trash2, Calendar, Clock,
    AlertCircle, Sun, Sunrise, Sunset, Moon, BarChart2, ListTodo,
    Loader2, CheckSquare, Hourglass, Search, SlidersHorizontal,
    ChevronLeft, ChevronRight, LayoutDashboard, Bell, FilePlus2,
    ListChecks, Menu, X, Check, Mail, Info
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

dayjs.extend(relativeTime);

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [greeting, setGreeting] = useState({ text: "", icon: null });

    // Interface State Control Indicators
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("All");
    const [activeTab, setActiveTab] = useState("overview");

    // Form State Architecture supporting unified ISO Datetime Conversion
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
    }, []);

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

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Assembly Frame: Compile independent date and time elements into a single ISO Datetime String
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

    const handleToggleComplete = async (id, currentStatus) => {
        try {
            const response = await api.put(`/tasks/${id}`, { completed: !currentStatus });
            const updated = response.data.task || response.data;
            setTasks(tasks.map(t => (t._id === id || t.id === id) ? { ...t, completed: updated.completed } : t));
            toast.success(updated.completed ? "Task resolved successfully" : "Task restored to active status");
        } catch (error) {
            toast.error("Status synchronization failed");
        }
    };

    const handleDeleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id && t.id !== id));
            toast.success("Task dropped from tracking system");
        } catch (error) {
            toast.error("Failed to delete task from server instance");
        }
    };

    const handleClearAllTasks = async () => {
        if (!window.confirm("CRITICAL INTERVENTION: This will wipe out all tracking logs. Proceed?")) return;
        try {
            await api.delete("/tasks/delete/all");
            setTasks([]);
            toast.success("All task logs cleared successfully.");
        } catch (error) {
            toast.error("Failed to clear task logs.", ErrorIcon);
        }
    };

    // Metrics Evaluation Core Logic
    const totalCount = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const overdueCount = tasks.filter(t => !t.completed && dayjs(t.dueDate).isBefore(dayjs())).length;
    const pendingCount = totalCount - completedCount - overdueCount;

    // Real-time Reminder indicators mapped from tasks array
    const activeRemindersList = tasks.filter(t => !t.completed);
    const unreadRemindersCount = tasks.filter(t => !t.completed && t.isReminderSent).length;

    const filteredTasks = tasks.filter(task => {
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

    const sidebarItems = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: "create", label: "Create Task", icon: <FilePlus2 className="w-4 h-4" /> },
        { id: "tasks", label: "My Tasks", icon: <ListChecks className="w-4 h-4" />, badge: pendingCount > 0 ? pendingCount : null },
        { id: "analytics", label: "Analytics", icon: <BarChart2 className="w-4 h-4" /> },
        { id: "reminders", label: "Reminders", icon: <Bell className="w-4 h-4" />, badge: unreadRemindersCount > 0 ? unreadRemindersCount : null }
    ];

    const handleTabSelection = (tabId) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-hidden">

            {/* Collapsible Sidebar Assembly Panel */}
            <motion.aside
                animate={{ width: isSidebarOpen ? 260 : 70 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="hidden md:flex flex-col bg-zinc-900 border-r border-white/5 h-screen sticky top-0 z-50 shrink-0 relative select-none"
            >
                {/* Floating Middle Edge Arrow Panel Toggle Mechanism */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-[24px] -right-[12px] bg-zinc-900 border border-white/10 hover:border-indigo-500/50 w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-400 shadow-md transition-all z-50 cursor-pointer"
                    title={isSidebarOpen ? "Collapse Menu" : "Expand Menu"}
                >
                    {isSidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {/* Chronova Branding Element Frame */}
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

                {/* Data Navigation Tree */}
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

                {/* Footer Logout Trigger Panel */}
                <div className="p-4 border-t border-white/5 overflow-hidden">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition duration-150 group cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition" />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* 2. PRIMARY VIEWPORT WORKSPACE & MOBILE INFRASTRUCTURE */}
            <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">

                {/* Navigation Header Configuration */}
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

                    <div className="flex items-center gap-3">
                        {activeTab === "tasks" && tasks.length > 0 && (
                            <button
                                onClick={handleClearAllTasks}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/10 bg-red-500/5 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear All Tasks</span>
                            </button>
                        )}
                        <button
                            onClick={logout}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 hover:border-red-500/20 text-zinc-400 hover:text-red-400 text-xs font-medium transition-all bg-zinc-900 cursor-pointer"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </header>

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
                                    onClick={logout}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/5 cursor-pointer w-full"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Core Workspace Hub Layout Matrix */}
                <main className="p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 flex-1">
                    {loading ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-xs text-zinc-500">Synchronizing database tracks...</p>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: DASHBOARD PERFORMANCE OVERVIEW */}
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
                                                    <p className="text-xs text-zinc-500">No active workflows available to chart.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 space-y-4">
                                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Priority Distribution</h2>
                                            <div className="space-y-3 pt-1">
                                                {["High", "Medium", "Low"].map((lvl) => {
                                                    const num = tasks.filter(t => t.priority === lvl).length;
                                                    const pct = totalCount > 0 ? (num / totalCount) * 100 : 0;
                                                    return (
                                                        <div key={lvl} className="space-y-1">
                                                            <div className="flex justify-between text-xs"><span className="text-zinc-400">{lvl} Tier</span><span>{num}</span></div>
                                                            <div className="h-1 bg-zinc-950 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} /></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 2: HIGH-PRECISION TIME TASK FORM */}
                            {activeTab === "create" && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto p-5 md:p-6 rounded-2xl bg-zinc-900 border border-white/5 space-y-6">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight">Create Task</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Chronova automated cron monitors map these specific time frames to launch automated notifications.</p>
                                    </div>
                                    <form onSubmit={handleCreateTask} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400 font-medium">Task Heading</label>
                                            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} placeholder="Specify main objective..." className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-100 placeholder-zinc-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-zinc-400 font-medium">Context Details</label>
                                            <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} placeholder="Provide task brief parameters or notes..." className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden resize-none text-zinc-100 placeholder-zinc-600" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Execution Date</label>
                                                <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Exact Reminder Time</label>
                                                <input type="time" name="dueTime" required value={formData.dueTime} onChange={handleInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-zinc-400 font-medium">Urgency Tier</label>
                                                <select name="priority" value={formData.priority} onChange={handleInputChange} className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs focus:border-indigo-500 focus:outline-hidden text-zinc-300">
                                                    <option value="Low">Low Priority</option>
                                                    <option value="Medium">Medium Priority</option>
                                                    <option value="High">High Priority</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs p-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-indigo-600/10">
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>Create Task</span>
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* TAB 3: DATA PIPELINE WORKSPACE GRID */}
                            {activeTab === "tasks" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <div className="relative w-full sm:max-w-xs">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-hidden focus:border-indigo-500 transition text-zinc-200 placeholder-zinc-600" />
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                                            <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className="bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-hidden">
                                                <option value="All">All Intensities</option>
                                                <option value="High">High Priority</option>
                                                <option value="Medium">Medium Priority</option>
                                                <option value="Low">Low Priority</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <AnimatePresence mode="popLayout">
                                            {filteredTasks.map((task) => (
                                                <motion.div key={task._id || task.id} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className={`p-4 rounded-xl bg-zinc-900 border ${task.completed ? "border-emerald-500/10 bg-emerald-950/5" : "border-white/5"} flex items-center justify-between gap-4 transition-all group`}>
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <button onClick={() => handleToggleComplete(task._id || task.id, task.completed)} className="mt-0.5 text-zinc-500 hover:text-indigo-400 transition cursor-pointer shrink-0">
                                                            {task.completed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <h4 className={`text-xs font-semibold tracking-tight transition ${task.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>{task.title}</h4>
                                                            {task.description && <p className="text-[11px] text-zinc-500 font-normal mt-0.5 truncate max-w-2xl">{task.description}</p>}
                                                            <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] font-medium text-zinc-500">
                                                                <span className={`px-1.5 py-0.5 rounded-md ${task.priority === "High" ? "bg-red-500/10 text-red-400" : task.priority === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{task.priority} Priority</span>
                                                                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{dayjs(task.dueDate).format("MMM DD, YYYY [-] hh:mm A")}</span></div>
                                                                {task.isReminderSent && <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-semibold"><Mail className="w-2.5 h-2.5" /> Email Reminded</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleDeleteTask(task._id || task.id)} className="sm:opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer shrink-0">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {filteredTasks.length === 0 && (
                                            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                                <p className="text-xs text-zinc-500">No active records match selected tracking parameters.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 4: METRICS & ANALYTICS VELOCITY */}
                            {activeTab === "analytics" && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-zinc-900 border border-white/5 space-y-6">
                                    <div>
                                        <h2 className="text-sm font-semibold tracking-tight">System Performance Metrics</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Automated telemetry logs calculated from current server states.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Completion Ratio</p>
                                            <h4 className="text-2xl font-black tracking-tight text-emerald-400 mt-2">{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</h4>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Cron Dispatch Node</p>
                                            <h4 className="text-2xl font-black tracking-tight text-indigo-400 mt-2">Active/Online</h4>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                                            <p className="text-xs text-zinc-500 font-medium">Remaining Load</p>
                                            <h4 className="text-2xl font-black tracking-tight text-amber-400 mt-2">{pendingCount + overdueCount} items</h4>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* TAB 5: DYNAMIC EMAIL REMINDER LOG SENTINELS */}
                            {activeTab === "reminders" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl">
                                        <h2 className="text-sm font-semibold tracking-tight">Automated Email Notification Tracks</h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">Chronova monitor states for queued or completed email dispatches.</p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {activeRemindersList.length > 0 ? (
                                            activeRemindersList.map((task) => {
                                                const due = dayjs(task.dueDate);
                                                const isPastDue = dayjs().isAfter(due);

                                                return (
                                                    <div
                                                        key={task._id || task.id}
                                                        className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3"
                                                    >
                                                        <div
                                                            className={`p-2 rounded-xl mt-0.5 shrink-0 ${task.isReminderSent
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : isPastDue
                                                                        ? "bg-rose-500/10 text-rose-400"
                                                                        : "bg-amber-500/10 text-amber-400"
                                                                }`}
                                                        >
                                                            {task.isReminderSent ? (
                                                                <Check className="w-4 h-4" />
                                                            ) : isPastDue ? (
                                                                <Clock3 className="w-4 h-4" />
                                                            ) : (
                                                                <Info className="w-4 h-4" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <h4 className="text-xs font-semibold text-zinc-200 truncate">
                                                                    {task.title}
                                                                </h4>

                                                                <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">
                                                                    {due.fromNow()}
                                                                </span>
                                                            </div>

                                                            <p className="text-[11px] text-zinc-400 mt-1">
                                                                {task.isReminderSent
                                                                    ? `Right on time — reminder delivered at ${due.format(
                                                                        "hh:mm A"
                                                                    )}.`
                                                                    : isPastDue
                                                                        ? `The scheduled reminder window passed ${due.fromNow()}.`
                                                                        : `Chronova will remind you on ${due.format(
                                                                            "MMM DD, YYYY [at] hh:mm A"
                                                                        )}.`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/30">
                                                <p className="text-xs text-zinc-500">
                                                    No active reminders scheduled.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;


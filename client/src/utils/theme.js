// =====================================
// PRIORITY COLORS
// =====================================

export const PRIORITY_STYLES = {
    Low: {
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        glow: "shadow-emerald-500/10",
    },

    Medium: {
        bg: "bg-amber-500/15",
        text: "text-amber-400",
        border: "border-amber-500/30",
        glow: "shadow-amber-500/10",
    },

    High: {
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/30",
        glow: "shadow-red-500/10",
    },
};


// =====================================
// TASK STATUS COLORS
// =====================================

export const STATUS_STYLES = {
    completed: {
        bg: "bg-emerald-500/15",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
    },

    pending: {
        bg: "bg-amber-500/15",
        text: "text-amber-400",
        border: "border-amber-500/30",
    },

    overdue: {
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/30",
    },
};


// =====================================
// DASHBOARD STATS COLORS
// =====================================

export const DASHBOARD_STATS = {
    total: {
        iconBg: "bg-indigo-500/15",
        iconColor: "text-indigo-400",
        border: "border-indigo-500/20",
    },

    completed: {
        iconBg: "bg-emerald-500/15",
        iconColor: "text-emerald-400",
        border: "border-emerald-500/20",
    },

    pending: {
        iconBg: "bg-amber-500/15",
        iconColor: "text-amber-400",
        border: "border-amber-500/20",
    },

    overdue: {
        iconBg: "bg-red-500/15",
        iconColor: "text-red-400",
        border: "border-red-500/20",
    },
};


// =====================================
// BUTTON STYLES
// =====================================

export const BUTTON_STYLES = {

    primary: `
        bg-indigo-600
        hover:bg-indigo-500
        text-white
        shadow-lg
        shadow-indigo-500/20
    `,

    danger: `
        bg-red-500/15
        hover:bg-red-500/25
        text-red-400
        border
        border-red-500/20
    `,

    success: `
        bg-emerald-500/15
        hover:bg-emerald-500/25
        text-emerald-400
        border
        border-emerald-500/20
    `,
};


// =====================================
// CARD STYLES
// =====================================

export const CARD_STYLE = `
    bg-white/5
    backdrop-blur-xl
    border
    border-white/10
    rounded-3xl
    shadow-2xl
`;


// =====================================
// INPUT STYLES
// =====================================

export const INPUT_STYLE = `
    w-full
    bg-slate-900/60
    border
    border-slate-700
    rounded-xl
    px-4
    py-4
    text-white
    placeholder:text-slate-500
    focus:border-indigo-500
    transition-all
`;



export const theme = {
  metrics: {
    total: "border-l-4 border-indigo-500 bg-zinc-900/50 backdrop-blur-md",
    pending: "border-l-4 border-amber-500 bg-zinc-900/50 backdrop-blur-md",
    completed: "border-l-4 border-emerald-500 bg-zinc-900/50 backdrop-blur-md"
  },
  priority: {
    high: {
      badge: "bg-red-500/10 text-red-400 border border-red-500/20",
      indicator: "bg-red-500",
      text: "text-red-400",
      border: "border-red-500/30"
    },
    medium: {
      badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      indicator: "bg-amber-500",
      text: "text-amber-400",
      border: "border-amber-500/30"
    },
    low: {
      badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      indicator: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-emerald-500/30"
    }
  }
};
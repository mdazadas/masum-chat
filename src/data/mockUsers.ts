export interface User {
    id: string; // UUID
    name: string;
    username: string;
    avatar_url: string;
    bio: string;
    email: string;
    created_at: string; // ISO Timestamp
}

export const allUsers: User[] = [
    { id: "u1-uuid-rahul", name: "Rahul Kumar", username: "rahul.kr", avatar_url: "", bio: "Busy at work. Text only!", email: "rahul@example.com", created_at: "2026-01-12T10:00:00Z" },
    { id: "u2-uuid-priya", name: "Priya Sharma", username: "priya_sharma", avatar_url: "", bio: "Available ✨", email: "priya@example.com", created_at: "2026-01-20T14:30:00Z" },
    { id: "u3-uuid-amit", name: "Amit Singh", username: "amit_99", avatar_url: "", bio: "Life is beautiful ❤️", email: "amit@example.com", created_at: "2026-02-05T09:15:00Z" },
    { id: "u4-uuid-suresh", name: "Suresh Raina", username: "suresh.r", avatar_url: "", bio: "Believe in yourself.", email: "suresh@example.com", created_at: "2025-12-15T18:45:00Z" },
    { id: "u5-uuid-vicky", name: "Vicky Kaushal", username: "vicky_k", avatar_url: "", bio: "Josh is high! ⚡", email: "vicky@example.com", created_at: "2026-02-01T11:20:00Z" },
    { id: "u6-uuid-deepika", name: "Deepika P", username: "deepika.padukone", avatar_url: "", bio: "Live, Love, Laugh.", email: "deepika@example.com", created_at: "2026-01-05T15:10:00Z" },
    { id: "u7-uuid-ranbir", name: "Ranbir Kapoor", username: "ranbir.k", avatar_url: "", bio: "Music is my life.", email: "ranbir@example.com", created_at: "2026-02-10T20:30:00Z" },
    { id: "u8-uuid-anushka", name: "Anushka Sharma", username: "anushka.s", avatar_url: "", bio: "Organic living.", email: "anushka@example.com", created_at: "2026-01-25T13:40:00Z" },
    { id: "u9-uuid-virat", name: "Virat Kohli", username: "virat.k82", avatar_url: "", bio: "Focus on the goal.", email: "virat@example.com", created_at: "2026-01-01T08:00:00Z" },
    { id: "u10-uuid-mahi", name: "M.S. Dhoni", username: "mahi77", avatar_url: "", bio: "Keep it simple. 🏆", email: "dhoni@example.com", created_at: "2026-01-07T12:00:00Z" },
    { id: "u11-uuid-srk", name: "Shah Rukh Khan", username: "srk_king", avatar_url: "", bio: "King of my own world.", email: "srk@example.com", created_at: "2026-02-15T22:15:00Z" },
    { id: "u12-uuid-alia", name: "Alia Bhatt", username: "alia.b", avatar_url: "", bio: "Dream big.", email: "alia@example.com", created_at: "2026-02-18T16:50:00Z" },
    { id: "u13-uuid-akshay", name: "Akshay Kumar", username: "akshay.k", avatar_url: "", bio: "Early bird gets the worm.", email: "akshay@example.com", created_at: "2026-02-12T05:30:00Z" },
    { id: "u14-uuid-katrina", name: "Katrina Kaif", username: "katrina_k", avatar_url: "", bio: "Stay graceful.", email: "katrina@example.com", created_at: "2026-02-20T19:25:00Z" },
    { id: "u15-uuid-sachin", name: "Sachin Tendulkar", username: "sachin.rt", avatar_url: "", bio: "Cricket is my breath.", email: "sachin@example.com", created_at: "2026-01-01T10:00:00Z" },
    { id: "u16-uuid-sunil", name: "Sunil Chhetri", username: "sunil.c", avatar_url: "", bio: "Football is passion.", email: "sunil@example.com", created_at: "2026-02-05T17:40:00Z" },
    { id: "u17-uuid-hrithik", name: "Hrithik Roshan", username: "hrithik.r", avatar_url: "", bio: "Keep moving forward.", email: "hrithik@example.com", created_at: "2026-02-10T11:00:00Z" },
    { id: "u18-uuid-priyanka", name: "Priyanka Chopra", username: "priyanka.c", avatar_url: "", bio: "Global citizen.", email: "priyanka@example.com", created_at: "2026-01-15T09:30:00Z" },
    { id: "u19-uuid-salman", name: "Salman Khan", username: "salman.k", avatar_url: "", bio: "Being human.", email: "salman@example.com", created_at: "2026-02-20T15:00:00Z" },
    { id: "u20-uuid-sara", name: "Sara Ali Khan", username: "sara.ak", avatar_url: "", bio: "Namaste! 🙏", email: "sara@example.com", created_at: "2026-02-21T18:10:00Z" },
];

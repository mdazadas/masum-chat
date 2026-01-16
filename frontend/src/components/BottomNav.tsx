'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Search, Heart, User, Phone } from 'lucide-react';

export default function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: '/home', icon: MessageSquare, label: 'Chats' },
        { href: '/calls', icon: Phone, label: 'Calls' },
        { href: '/search', icon: Search, label: 'Discover' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-6 pointer-events-none">
            <div className="glass w-full max-w-[450px] flex items-center justify-around p-3 rounded-2xl shadow-2xl pointer-events-auto">
                {links.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center gap-1 flex-1 transition-all ${isActive ? 'text-accent scale-110' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-accent/10' : ''}`}>
                                <Icon className={`w-6 h-6 ${isActive ? 'fill-accent/20' : ''}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

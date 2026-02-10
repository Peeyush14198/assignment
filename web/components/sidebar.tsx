'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, FileText } from 'lucide-react';
import { cn } from './ui/button';

const navItems = [
    { href: '/cases', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/cases/create', label: 'Create Case', icon: PlusCircle },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6">
                <div className="flex items-center space-x-2 text-primary-400 font-bold text-xl">
                    <FileText className="h-8 w-8" />
                    <span>CaseManager</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/cases' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                                isActive
                                    ? 'bg-primary-600 text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Admin User</p>
                        <p className="text-xs text-slate-400">admin@example.com</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

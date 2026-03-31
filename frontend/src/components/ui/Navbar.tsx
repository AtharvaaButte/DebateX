import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScroll } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { name: 'Rooms', href: '/rooms' },
    { name: 'Features', href: '#features' },
    { name: 'Create', href: '/rooms' },
]

export default function Navbar() {
    const [menuState, setMenuState] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const { scrollYProgress } = useScroll()
    const { profile } = useAuth()

    React.useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            setScrolled(latest > 0.05)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    const handleLogout = () => {
        localStorage.removeItem('debate_token');
        localStorage.removeItem('debate_uid');
        window.location.href = '/login';
    };

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className={cn('group fixed inset-x-0 top-0 z-50 w-full border-b border-border/40 transition-colors duration-150', scrolled ? 'bg-background/80 backdrop-blur-3xl' : 'bg-background')}>
                <div className="mx-auto max-w-5xl px-6 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
                            <Link
                                to="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>

                            <div className="hidden lg:block">
                                <ul className="flex gap-8 text-sm">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                to={item.href}
                                                className="text-muted-foreground hover:text-foreground block duration-150 font-medium">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                to={item.href}
                                                onClick={() => setMenuState(false)}
                                                className="text-muted-foreground hover:text-foreground block duration-150 font-medium">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {profile ? (
                                <div className="flex w-full items-center gap-3 sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                    <span className="text-sm font-medium hidden md:block text-foreground">{profile.username}</span>
                                    <img 
                                        src={profile.avatar} 
                                        className="h-8 w-8 rounded-full bg-accent border" 
                                        alt="Avatar"
                                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=fallback'; }} 
                                    />
                                </div>
                            ) : (
                                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                    <Button asChild variant="ghost" size="sm">
                                        <Link to="/login" onClick={() => setMenuState(false)}>
                                            <span>Login</span>
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link to="/login" onClick={() => setMenuState(false)}>
                                            <span>Sign Up</span>
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = ({ className }: { className?: string }) => {
    return (
        <div className={cn('flex items-center gap-2 text-foreground', className)}>
            <svg
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-auto">
                <path d="M3 0H5V18H3V0ZM13 0H15V18H13V0ZM18 3V5H0V3H18ZM0 15V13H18V15H0Z" fill="url(#logo-gradient)" />
                <defs>
                    <linearGradient id="logo-gradient" x1="10" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#9B99FE" />
                        <stop offset="1" stopColor="#2BC8B7" />
                    </linearGradient>
                </defs>
            </svg>
            <span className="font-bold text-lg tracking-tight">
                Debate<span className="text-indigo-500">X</span>
            </span>
        </div>
    )
}

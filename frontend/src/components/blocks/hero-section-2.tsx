'use client'

import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import FlippingCardDemo from '@/components/blocks/flipping-card-demo'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    return (
        <main className="overflow-hidden">
            <section>
                <div className="relative pt-24">
                    <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"></div>
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="sm:mx-auto lg:mr-auto">
                            <AnimatedGroup
                                variants={{
                                    container: {
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.05,
                                                delayChildren: 0.75,
                                            },
                                        },
                                    },
                                    ...transitionVariants,
                                }}
                            >
                                <h1
                                    className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 text-foreground">
                                    Win arguments. Not just shout them.
                                </h1>
                                <p
                                    className="mt-8 max-w-2xl text-pretty text-lg text-muted-foreground">
                                    Step into structured, turn-based debates where every move counts.<br /><br />
                                    Face real opponents or AI challengers — and get judged on logic, clarity, and impact.<br /><br />
                                    No chaos. No noise. Just pure argument.
                                </p>
                                <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                                    <div
                                        key={1}
                                        className="bg-foreground/10 rounded-[14px] border p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-xl px-5 text-base">
                                            <Link to="/rooms">
                                                <span className="text-nowrap">Start Debate</span>
                                            </Link>
                                        </Button>
                                    </div>
                                    <div
                                        key={2}
                                        className="bg-foreground/10 rounded-[14px] border p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            variant="secondary"
                                            className="rounded-xl px-5 text-base bg-background text-foreground hover:bg-muted font-medium shadow-none border-0">
                                            <Link to="/login">
                                                <span className="text-nowrap">Create Account</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </AnimatedGroup>
                            <div className="mt-12">
                                <FlippingCardDemo />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

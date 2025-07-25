'use client'
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react'

const NavBar: React.FC = () => {
    return (
       <nav className='p-4 flex justify-between items-center bg-gray-950 text-white border-b border-white/30'>
        <div>
            <Link href="/" className="cursor-pointer">
                <h1 className='text-2xl font-bold bg-gradient-to-r from-yellow-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity'>
                   AWS S3 Manager
                </h1>
            </Link>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/config">
                <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                </Button>
            </Link>
            <UserButton />
        </div>
       </nav >
   )
};

export default NavBar;

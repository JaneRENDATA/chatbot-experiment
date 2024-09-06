/* eslint-disable @typescript-eslint/naming-convention */
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

const Header: React.FC = () => {
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [isResourcesOpen, setIsResourcesOpen] = useState(false);

    return (
        <header className="bg-base-200 text-base-content shadow-lg mb-4">
            <div className="container mx-auto px-4">
                <div className="navbar py-2">
                    <div className="flex-1">
                        <Link href="/" className="btn btn-ghost normal-case text-xl">ChatBI</Link>
                    </div>
                    <div className="flex-none">
                        <ul className="menu menu-horizontal px-1 items-center">
                            <li><Link href="/features" className="px-3 py-2 hover:bg-base-400 hover:border rounded-lg transition-colors duration-200">Features</Link></li>
                            <li className="relative group">
                                <button
                                    className="px-3 py-2 hover:bg-base-300 rounded-lg hover:border flex items-center transition-colors duration-200"
                                    onMouseEnter={() => setIsProductsOpen(true)}
                                    onMouseLeave={() => setIsProductsOpen(false)}
                                >
                                    Products
                                    <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                                </button>
                                <ul
                                    className={`absolute top-full left-0 mt-2 w-48 bg-base-200 rounded-lg shadow-xl z-10 overflow-hidden transition-all duration-200 ease-in-out border border-base-500 ${isProductsOpen ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    onMouseEnter={() => setIsProductsOpen(true)}
                                    onMouseLeave={() => setIsProductsOpen(false)}
                                >
                                    <li><Link href="/products/data-analysis" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Data Analysis</Link></li>
                                    <li><Link href="/products/visualization" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Visualization</Link></li>
                                    <li><Link href="/products/reporting" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Reporting</Link></li>
                                </ul>
                            </li>
                            <li className="relative group">
                                <button
                                    className="px-3 py-2 hover:bg-base-300 rounded-lg flex items-center hover:border transition-colors duration-200"
                                    onMouseEnter={() => setIsResourcesOpen(true)}
                                    onMouseLeave={() => setIsResourcesOpen(false)}
                                >
                                    Resources
                                    <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                                </button>
                                <ul
                                    className={`absolute top-full left-0 mt-2 w-48 bg-base-200 rounded-lg shadow-xl z-10 overflow-hidden transition-all duration-200 ease-in-out border border-base-500 ${isResourcesOpen ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    onMouseEnter={() => setIsResourcesOpen(true)}
                                    onMouseLeave={() => setIsResourcesOpen(false)}
                                >
                                    <li><Link href="/resources/documentation" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Documentation</Link></li>
                                    <li><Link href="/resources/tutorials" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Tutorials</Link></li>
                                    <li><Link href="/resources/blog" className="block px-4 py-2 hover:bg-base-300 transition-colors duration-200">Blog</Link></li>
                                </ul>
                            </li>
                            <li><Link href="/pricing" className="px-3 py-2  hover:border  hover:bg-base-300 rounded-lg transition-colors duration-200">Pricing</Link></li>
                            <li><Link href="/contact" className="px-3 py-2 hover:border  hover:bg-base-300 rounded-lg transition-colors duration-200">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

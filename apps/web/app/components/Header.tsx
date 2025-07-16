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
            <Link href="/" className="btn btn-ghost normal-case text-xl">Chatbox</Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1 items-center">
              <li>
                <Link href="/rule-admin" className="px-3 py-2 hover:bg-base-300 hover:border rounded-lg transition-colors duration-200">
                  Rule Admin
                </Link>
              </li>
              <li>
                <Link href="/py-editor" className="px-3 py-2 hover:bg-base-300 hover:border rounded-lg transition-colors duration-200">
                  Python Editor
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

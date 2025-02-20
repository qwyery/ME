import { Link, useLocation } from 'react-router-dom';
import { ShirtIcon, Target, Book } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/closet', label: 'Closet', Icon: ShirtIcon },
    { to: '/goals', label: 'Goals', Icon: Target },
    { to: '/diary', label: 'Diary', Icon: Book },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 shadow-lg">
      <div className="max-w-screen-xl mx-auto flex justify-around items-center">
        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center p-2 ${
              location.pathname === to
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
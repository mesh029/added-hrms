import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Dialog } from '@mui/material';
import { Notifications as NotificationsIcon } from "@mui/icons-material"; // MUI Notifications Icon
import { Calendar, CheckCircle } from 'lucide-react';

export default function Header() {
  interface Notification {
    id: number;
    message: string;
    read: boolean;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [parsedData, setParsedData] = useState<{ id?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem('userData') ?? '{}';
      try {
        setParsedData(JSON.parse(storedData));
      } catch (error) {
        console.error('Error parsing userData:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (parsedData?.id) {
      fetch(`/api/notifications/${parsedData.id}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch notifications");
          }
          return response.json();
        })
        .then(data => {
          const notificationsWithReadStatus = (data || []).map((notification: any) => ({
            ...notification,
            read: notification.read ?? false,
          }));
          setNotifications(notificationsWithReadStatus);
        })
        .catch(err => {
          console.error('Error fetching notifications:', err);
          setNotifications([]); // Ensure notifications state is empty if an error occurs
        });
    } else {
      setNotifications([]); // Handle cases where `parsedData?.id` is not available
    }
  }, [parsedData]);
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    fetch(`/api/notifications/read`, {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: [notification.id] }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(() => {
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      })
      .catch(err => console.error('Error marking notification as read:', err));
  };

  const handleMarkAllAsRead = () => {
    const unreadNotifications = notifications.filter(notification => !notification.read);
    const unreadIds = unreadNotifications.map(n => n.id);

    fetch(`/api/notifications/read`, {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: unreadIds }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(() => {
        setNotifications(prevNotifications =>
          prevNotifications.map(n => ({ ...n, read: true }))
        );
        setIsDropdownOpen(false);
      })
      .catch(err => console.error('Error marking all notifications as read:', err));
  };

  const handleTickNotification = (notification: Notification) => {
    fetch(`/api/notifications/read`, {
      method: 'PATCH',
      body: JSON.stringify({ notificationIds: [notification.id] }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(() => {
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
      })
      .catch(err => console.error('Error marking notification as read:', err));
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  return (
    <Card className="bg-gradient-to-r from-red-900 to-blue-900 text-white mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-2">Welcome to PATH HRMS Portal</h1>
            <p className="text-lg opacity-90">Manage your work, time, and team efficiently</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4">
          <Link href={`/`}>
            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              Log out
            </Button>
            </Link>

            {/* Notifications Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="secondary"
                className="bg-white text-blue-900 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                ref={buttonRef}
              >
                <NotificationsIcon className="mr-2 h-4 w-4" /> {/* MUI Icon */}
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">Leave Notifications</h3>
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        !notification.read && (
                          <div key={index} className="flex items-center space-x-2 mb-2">
                            <NotificationsIcon className="text-blue-900" />
                            <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <CheckCircle
                              className={`cursor-pointer text-green-500 ${notification.read ? 'opacity-50' : ''}`}
                              onClick={() => handleTickNotification(notification)}
                            />
                          </div>
                        )
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No new notifications</p>
                    )}
                  </div>
                  <div className="border-t p-2">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-blue-600 w-full text-left"
                    >
                      Mark All as Read
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Calendar } from "lucide-react";
import Link from 'next/link';

export default function Header() {
  interface Notification {
    message: string;
    isRead: boolean;
  }

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [parsedData, setParsedData] = useState<{ id?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // ✅ Only access localStorage when the component mounts (client-side only)
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
      fetch(`http://localhost:3030/api/notifications/${parsedData.id}`)
        .then(response => response.json())
        .then(data => {
          const notificationsWithReadStatus = data.map((notification: any) => ({
            ...notification,
            isRead: notification.isRead ?? false,
          }));
          setNotifications(notificationsWithReadStatus);
        })
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [parsedData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleViewNotifications = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <Card className="bg-gradient-to-r from-red-900 to-blue-900 text-white mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold mb-2">Welcome to PATH HRMS Portal</h1>
            <p className="text-lg opacity-90">Manage your work, time, and team efficiently</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4">
            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              <Link href={`/`}>Log out</Link>
            </Button>

            {/* Notifications Button with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="secondary"
                className="bg-white text-blue-900 hover:bg-gray-100"
                onClick={() => {
                  setIsDropdownOpen(prev => !prev);
                  handleViewNotifications();
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg border">
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">Leave Notifications</h3>
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <MessageCircle className="text-blue-900" />
                          <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No new notifications</p>
                    )}
                  </div>
                  <div className="border-t p-2">
                    <Link href="/leave" className="text-blue-600">View All</Link>
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

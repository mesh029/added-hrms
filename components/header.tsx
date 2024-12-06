import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserCircle, Bell, Calendar } from "lucide-react"
import Link from 'next/link';

export default function Header() {
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
              <UserCircle className="mr-2 h-4 w-4" />
              <Link href={`/`}>
          Log out          
          </Link>
            </Button>
            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="secondary" className="bg-white text-blue-900 hover:bg-gray-100">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UserManagement from './../user/page'

export default function UserManagementLanding() {
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<number>(21) // Default user ID
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  const handleNewUser = () => {
    setIsNewUser(true)
    setUserData(null) // Clear data for new user
  }

  const handleExistingUser = async () => {
    setIsNewUser(false)
    try {
      const response = await fetch(`/api/users?id=${userId}`)
      const data = await response.json()
      setUserData(data)
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  if (isNewUser !== null) {
    return <UserManagement  />
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Choose an action to proceed</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button onClick={handleNewUser}>Create New User</Button>
          <Button onClick={handleExistingUser} variant="outline">View/Edit Existing User</Button>
        </CardContent>
      </Card>
    </div>
  )
}

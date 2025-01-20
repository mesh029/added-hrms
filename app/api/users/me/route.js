// app/api/user/me/route.js
import { NextResponse } from 'next/server';
import { authenticateToken } from '../../middlewares/authMiddleWare'; // Import the middleware

export async function GET(req) {
    // Apply the authenticateToken middleware to verify the token
    const authResponse = authenticateToken(req);
    if (authResponse) {
        return authResponse; // If unauthorized, return error response
    }

    try {
        // The user information will be available as req.user after the middleware
        const user = req.user; // Assuming the user information is in the token

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Error fetching user' }, { status: 500 });
    }
}

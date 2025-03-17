import connectToDatabase from '../../../lib/mongodb';
import { hash } from '../../../lib/hash';
import crypto from 'crypto'

export async function POST(req) {
    try {
        const {db} = await connectToDatabase();
        const body = await req.json();

        // Validation errors object
        const errors = {};

        if (!body.email || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(body.email)) {
            errors.email = "Valid email is required";
        }
        if (!body.password || body.password.length < 3) {
            errors.password = "Password must be at least 3 characters";
        }
        if (body.confirmPassword !== body.password) {
            errors.confirmPassword = "Passwords do not match";
        }
        console.log("Num errors: ", errors.length)
        // If there are errors, return them along with the partially filled data
        if (Object.keys(errors).length > 0) {
            return Response.json({
                success: false,
                errors,
                formData: body
            },
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        
        //checks for existing user with same email
        const existingUser = await db.collection('users').findOne({ email: body.email });
        
        if (existingUser) {
            console.log("User already exists");
            return Response.json({
                success: false,
                message: "User already exists",
                formData: body
            },
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        
        //hash password with bcrypt
        const hashedPassword = hash(body.password);
        const newUser = await db.collection('users').insertOne({ email: body.email, password: hashedPassword, numcalls: 0 });
        
        //hash session token
        const hashedSession = hash(crypto.randomBytes(32).toString("hex"));
        const newSession = await db.collection('sessions').insertOne({email: body.email, token: hashedSession, expiry: new Date(Date.now() + 60 * 60 * 1000)})

        return new Response(JSON.stringify({
            message: "Signup success",
            formData: body,
            email: body.email,
            sessionToken: hashedSession,
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({
            error: "Something went wrong"
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
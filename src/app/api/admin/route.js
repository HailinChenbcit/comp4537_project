import connectToDatabase from '../../../lib/mongodb';
export async function POST(req) {
    try{
        const {db} = await connectToDatabase();
        const body = await req.json();
        const validSession = await db.collection('sessions').findOne({email: body.email, token: body.session});
        if (!validSession) {
            return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
        }

        const info = await db.collection('users').find({}, {projection: {email: 1, numcalls: 1, _id: 0}}).toArray();
        console.log(info);
        return new Response(JSON.stringify(info), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        })
        
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({
            error: "Something went wrong"
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
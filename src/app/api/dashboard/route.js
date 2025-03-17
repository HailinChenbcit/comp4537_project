import connectToDatabase from '../../../lib/mongodb';
export async function POST(req) {
    try{
        const {db} = await connectToDatabase();
        const body = await req.json();
        const validSession = await db.collection('sessions').findOne({email: body.email, token: body.session});
        if(validSession){
            const user = await db.collection('users').findOne({email: body.email})
            return new Response(JSON.stringify({numcalls: user.numcalls}))
        }
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({
            error: "Something went wrong"
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
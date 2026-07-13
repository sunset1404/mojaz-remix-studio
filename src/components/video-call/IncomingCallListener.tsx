import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface IncomingCall {
    id: string;
    room_id: string;
    student_name: string;
}

export const IncomingCallListener = () => {
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        let channel: RealtimeChannel;
        let userId: string;

        const setupListener = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            userId = session.user.id;

            // Subscribe to new sessions assigned to this reciter
            channel = supabase.channel(`incoming:${userId}`);
            channel
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'video_call_sessions',
                        filter: `reciter_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('Incoming call INSERT event:', payload);
                        const callerRole = payload.new.caller_role || 'student';
                        if (payload.new.status === 'waiting' && callerRole === 'student') {
                            setIncomingCall({
                                id: payload.new.id,
                                room_id: payload.new.room_id,
                                student_name: payload.new.student_name || 'طالب',
                            });
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'video_call_sessions',
                        filter: `reciter_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('Call session UPDATE event:', payload);
                        if (payload.new.status !== 'waiting' || payload.new.reciter_joined_at) {
                            setIncomingCall(null);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('Incoming call channel status:', status);
                });
        };

        setupListener();

        // Check for missed calls if component remounts
        const checkExistingCalls = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data } = await supabase
                .from('video_call_sessions')
                .select('id, room_id, student_name, caller_role')
                .eq('reciter_id', session.user.id)
                .eq('caller_role', 'student')
                .eq('status', 'waiting')
                .is('reciter_joined_at', null)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (data) {
                setIncomingCall({
                    id: data.id,
                    room_id: data.room_id,
                    student_name: data.student_name || 'طالب',
                });
            }
        };

        checkExistingCalls();

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const handleAccept = async () => {
        if (!incomingCall) return;

        try {
            // Record acceptance. The database marks the call active only after
            // both WebRTC peer connections report connected.
            await supabase
                .from('video_call_sessions')
                .update({ reciter_joined_at: new Date().toISOString() })
                .eq('id', incomingCall.id);

            const roomId = incomingCall.room_id;
            setIncomingCall(null);
            navigate(`/call/${roomId}?role=callee`);
        } catch (error) {
            console.error('Failed to accept call:', error);
        }
    };

    const handleReject = async () => {
        if (!incomingCall) return;

        try {
            await supabase
                .from('video_call_sessions')
                .update({ status: 'failed', ended_at: new Date().toISOString() })
                .eq('id', incomingCall.id);

            setIncomingCall(null);
        } catch (error) {
            console.error('Failed to reject call:', error);
        }
    };

    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="rounded-3xl p-8 max-w-sm w-[90%] mx-auto flex flex-col items-center gap-5 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/15 relative overflow-hidden"
                style={{
                    background: "linear-gradient(170deg, hsl(174 42% 28%) 0%, hsl(174 42% 35%) 40%, hsl(174 38% 40%) 70%, hsl(174 35% 38%) 100%)",
                }}
            >
                {/* Gold glow */}
                <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
                    background: "radial-gradient(ellipse 70% 50% at 50% 80%, hsl(43 50% 50% / 0.2) 0%, transparent 70%)",
                }} />

                <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse border border-white/20 relative z-10">
                    <Phone className="w-10 h-10 text-white" />
                </div>

                <div className="text-center space-y-2 relative z-10">
                    <h3 className="text-2xl font-bold font-cairo text-white">مكالمة واردة</h3>
                    <p className="text-white/70 text-base">
                        من الطالب/ة <span className="font-semibold text-[#d2ac4b]">{incomingCall.student_name}</span>
                    </p>
                </div>

                <div className="flex gap-4 w-full mt-3 relative z-10" dir="rtl">
                    <Button
                        onClick={handleAccept}
                        size="lg"
                        className="flex-1 rounded-full h-14 text-lg bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg"
                    >
                        <Phone className="w-5 h-5 ml-2" />
                        رد
                    </Button>
                    <Button
                        onClick={handleReject}
                        size="lg"
                        className="flex-1 rounded-full h-14 text-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg"
                    >
                        <PhoneOff className="w-5 h-5 ml-2" />
                        رفض
                    </Button>
                </div>
            </div>
        </div>
    );
};

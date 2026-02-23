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
            channel.on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'video_call_sessions',
                    filter: `reciter_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new.status === 'waiting') {
                        setIncomingCall({
                            id: payload.new.id,
                            room_id: payload.new.room_id,
                            student_name: payload.new.student_name || 'طالب',
                        });

                        // Play ringtone natively or via webaudio if needed
                    }
                }
            ).subscribe();

            // Listen for canceled calls
            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'video_call_sessions',
                    filter: `reciter_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new.status !== 'waiting') {
                        setIncomingCall(null);
                    }
                }
            )
        };

        setupListener();

        // Check for missed calls if component remounts
        const checkExistingCalls = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data } = await supabase
                .from('video_call_sessions')
                .select('id, room_id, student_name')
                .eq('reciter_id', session.user.id)
                .eq('status', 'waiting')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle() as any;

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
            // Update status to active
            await supabase
                .from('video_call_sessions')
                .update({ status: 'active', reciter_joined_at: new Date().toISOString() })
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-[90%] flex flex-col items-center gap-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-pulse">
                    <Phone className="w-12 h-12 text-primary fill-primary/20" />
                </div>

                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">مكالمة واردة</h3>
                    <p className="text-gray-500 text-lg">
                        من الطالب/ة <span className="font-semibold text-primary">{incomingCall.student_name}</span>
                    </p>
                </div>

                <div className="flex gap-4 w-full mt-4">
                    <Button
                        onClick={handleReject}
                        variant="destructive"
                        size="lg"
                        className="flex-1 rounded-full h-14 text-lg"
                    >
                        <PhoneOff className="w-6 h-6 ml-2" />
                        رفض
                    </Button>
                    <Button
                        onClick={handleAccept}
                        size="lg"
                        className="flex-1 rounded-full h-14 text-lg bg-green-500 hover:bg-green-600"
                    >
                        <Phone className="w-6 h-6 ml-2" />
                        رد
                    </Button>
                </div>
            </div>
        </div>
    );
};

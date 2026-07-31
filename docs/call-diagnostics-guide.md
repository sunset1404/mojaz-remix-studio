# Call diagnostics test guide

The diagnostics must be collected from updated builds on both sides of the
call. Compare the `caller` and `callee` rows for the same `room_id`.

## Controlled test

1. Confirm both devices are running the build containing diagnostic version 3.
2. Start a call and allow camera and microphone access on both devices.
3. Explicitly enable the camera; the application starts calls with video off.
4. Keep both applications in the foreground.
5. Both participants should speak continuously for at least 30 seconds while
   leaving the camera enabled.
6. End the call normally, then open **Admin → Call Diagnostics** and filter by
   the room ID.

## Interpretation

| Evidence | Meaning |
| --- | --- |
| `media_capture_failed_all` | The device did not provide usable local media. Inspect `details.error` and `details.mediaEnvironment`. |
| `NotAllowedError` | Permission was denied or blocked by the operating system/browser. |
| `NotFoundError` | No matching microphone/camera was available. |
| `NotReadableError` | The device existed but could not be opened, commonly because another application or the OS held it. |
| `media_capture_audio_only` | The combined request failed but microphone-only capture succeeded. |
| `call_initialization_failed` | Call setup failed before completion. `details.stage` identifies peer connection, signaling, media capture, or readiness persistence. |
| `signaling_operation_failed` | Durable SDP/signaling processing failed; this is not a NAT diagnosis. |
| `ice_failed_stun_unreachable_or_udp_blocked` | No server-reflexive candidate was gathered. STUN was unreachable or UDP was blocked. This is an inference, not an exact firewall rule. |
| `ice_failed_peer_to_peer_path_blocked_stun_only` | STUN produced a public candidate, but the peers could not establish a direct route. Restrictive NAT or firewall behavior is likely. |
| `no_candidate_pair_p2p_blocked_stun_only` | ICE checking could not select a direct candidate pair after negotiation completed. |
| `healthy_media_flow` | A selected route exists and audio RTP is flowing. Inspect `details.video` to confirm video frames too. |
| `local_microphone_track_muted_by_device` | The browser/OS marked the captured microphone track as muted. |
| `audio_capture_present_sender_not_emitting_rtp` | The local microphone exists, but the WebRTC sender is not producing audio RTP. |
| `peer_reports_no_inbound_audio` | This client sends audio RTP, while remote-receiver statistics report no corresponding inbound packets. |
| `no_inbound_audio_rtp` | The selected route works, but this endpoint receives no audio RTP. Compare the other endpoint's outbound counters and track state. |
| `remote_audio_received_playback_blocked` | Audio packets arrive, but the browser rejected playback. This is not a NAT problem. |
| `local_video_enabled_but_not_encoding` | A live, enabled camera track exists, but the sender is not encoding video frames. |
| `remote_video_playback_failed` | Video media reached the UI layer, but the HTML video element could not play it. |

The `details` JSON also records:

- local and remote audio/video track state;
- inbound/outbound audio and video packets and bytes;
- encoded and decoded video frame counts;
- selected local/remote candidate types and protocol;
- ICE candidate types, candidate errors, and whether TURN was configured;
- round-trip time and available bitrate when the browser exposes them;
- audio/video codecs;
- permission state, media device counts, app visibility, and network hints;
- remote audio element playback success or rejection.

## Limits of the evidence

Standard browser WebRTC APIs do not expose an authoritative NAT subtype or the
device/network firewall rules. The diagnostics can distinguish:

- failure to reach STUN or use UDP;
- successful STUN discovery followed by failed direct peer-to-peer traversal;
- an established ICE route with missing RTP;
- local capture, encoding, receiving, or playback failures.

They cannot prove whether a failed direct route was caused specifically by
symmetric NAT versus a particular firewall rule. A configured TURN relay test
would be required to prove that relaying resolves that route. The browser also
cannot reliably report physical speaker volume or every OS/Bluetooth output
routing problem.

No additional Supabase schema is required for diagnostic version 3. Extended
evidence is stored in the existing `call_diagnostics.details` JSON field.

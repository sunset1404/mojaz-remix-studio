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

## TURN, recovery and relay verdicts (diagnostic version 3)

| Verdict | Meaning |
| --- | --- |
| `turn_credentials_fetch_started` | The client requested temporary coturn credentials from the `turn-credentials` function. |
| `turn_credentials_fetch_succeeded` | Temporary credentials were received and validated. `details` carries only latency, TTL remaining, URL count and protocol booleans. |
| `turn_credentials_fetch_failed` | Credentials could not be obtained (function unreachable, `turn_not_configured`, timeout, malformed response). The call continues with STUN only and is flagged degraded. |
| `turn_credentials_expired` | The returned expiry was already in the past; credentials were discarded and STUN-only was used. |
| `turn_configured` | The peer connection was created with TURN servers merged on top of the STUN defaults. |
| `turn_configured_but_no_relay_candidate` | TURN was offered to the browser but no `relay` candidate was gathered — coturn is unreachable, blocked, or the shared secret does not match. |
| `relay_candidate_gathered` | A `relay` candidate was gathered. This proves credential acceptance, not that relaying was selected. |
| `connected_via_turn_udp` / `_tcp` / `_tls` | The selected candidate pair uses a relay candidate over the given transport. |
| `turn_route_failed` | A relay route was selected but media does not flow through it. |
| `camera_required_but_unavailable` | Video was required for this participant and capture failed. |
| `local_video_reacquire_started` / `_succeeded` / `_failed` | Camera reacquisition attempt (`replaceTrack`, or add-track plus caller-owned renegotiation). |
| `media_watchdog_stall_detected` | Three consecutive `getStats()` samples showed no RTP progress for expected live media while ICE stayed connected. |
| `media_recovery_started` / `_succeeded` / `_failed` | One bounded recovery action (playback retry, video reacquire, ICE restart, rebuild) with `action` and `attempt`. |

Distinct outcomes to compare when triaging: credential fetch failure
(`turn_credentials_fetch_failed`), TURN offered but unusable
(`turn_configured_but_no_relay_candidate`), relay gathered but not selected
(`relay_candidate_gathered` without `connected_via_turn_*`), relay selected but
mute (`turn_route_failed`), and media stalled while ICE stayed connected
(`media_watchdog_stall_detected` versus `ice_failed_*`).

## Forced-relay validation procedure

1. Configure `TURN_URLS`, `TURN_SHARED_SECRET` and (optionally)
   `TURN_TTL_SECONDS` as backend secrets.
2. In a temporary build only, set `iceTransportPolicy: 'relay'` where the
   `RTCPeerConnection` is created in `src/lib/webrtc/WebRTCManager.ts`.
3. Place a call between two devices and confirm in Admin -> Call Diagnostics:
   `turn_credentials_fetch_succeeded`, `turn_configured`,
   `relay_candidate_gathered`, and one `connected_via_turn_udp|tcp|tls`.
4. Confirm two-way audio and video.
5. Revert the temporary build to `iceTransportPolicy: 'all'` before shipping.

## Status: coturn deployment — BLOCKED

The application side is complete and verified with STUN-only fallback:

- `turn-credentials` is deployed and returns `503 turn_not_configured` while
  `TURN_URLS` / `TURN_SHARED_SECRET` are unset;
- the client then records `turn_credentials_unavailable`, keeps the existing
  STUN configuration, and the call proceeds exactly as before.

Blocked until the owner supplies the real values (no placeholders are used):

1. coturn host deployment and `static-auth-secret`;
2. the `TURN_URLS` and `TURN_SHARED_SECRET` secrets;
3. real relay verification — confirming `relay_candidate_gathered` and
   `connected_via_turn_udp/tcp/tls` from an out-of-Saudi client, which is the
   only way to prove relaying fixes the one-way-audio cases.

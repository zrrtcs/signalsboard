Noted.
Language nudge: say “Please add explanatory notes for each diagram.”

# Akka.NET (Actor model) — reading guide

**Lanes**

* **Host/Timer**
  Boots the process, loads options, builds the `ActorSystem`, queries `patientIds`, and drives time via `PeriodicTimer`. Scope: wiring and ticks.
* **Coordinator (Actor)**
  Creates one `PatientActor` per bed. For warmup, broadcasts a `Warmup(from,to)` to all children. On each tick, fans out `Tick(now)` to children, collects `VitalGenerated` into a batch, then flushes.
* **PatientActor\[i]**
  Owns the per-bed RNG and small state (profile + random walk). On `Tick`, computes one `VitalSample` and tells parent. On `Warmup`, synthesizes historical samples for the window.
* **BroadcasterActor**
  Adapts actor messages to your service boundary. Receives `VitalBatchGenerated`, calls `IVitalBroadcaster.PublishAsync(batch)`.
* **SignalR Broadcaster (Service)**
  Pure service. Writes each sample to the in-memory ring buffer, maps to DTOs, pushes to SignalR clients.
* **Health/Logging**
  Periodic metrics: samples/sec, batch size, last push time.

**Flow**

1. Host builds `ActorSystem`, queries beds.
2. Coordinator spawns `PatientActor[i]`, warms up history.
3. Timer ticks → Coordinator → `PatientActor[i]`.
4. Patients emit `VitalGenerated` → Coordinator batches.
5. Coordinator flushes → BroadcasterActor → service → hub.

**Why this works**

* Isolation: each bed’s state is confined to its actor.
* Ordering: per-sender mailbox preserves order.
* Supervision: restart a misbehaving `PatientActor` without affecting others.
* Swap-ability: later, replace Coordinator with Cluster/Sharding to scale out.

**Back-pressure**

* Mailboxes are unbounded by default—batching in Coordinator is your throttle. If broadcasting lags, batches grow; monitor and cap.

**Failure**

* Use supervision strategies: restart `PatientActor` on exceptions; log and continue in Coordinator; drop or retry in Broadcaster depending on environment (dev vs prod).

**Scale lever**

* Single node: increase interval or partition into multiple coordinators.
* Multi-node: introduce Akka.Cluster (+ Sharding) and route by `patientId`.

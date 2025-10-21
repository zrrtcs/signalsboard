# CSP (Tasks + Channels) — reading guide

**Lanes**

* **Host/Wiring**
  Loads options, queries `patientIds`, creates one **bounded** `Channel<VitalSample>` per bed, starts each `BedTask`, and spins up Merge/Batcher/Broadcaster tasks.
* **BedTask\[i]**
  Owns RNG + minimal state. Optional warmup: writes historical samples to its channel. Then loops on `PeriodicTimer`, generates one sample per tick, writes to its bounded channel. If full, apply policy: block / drop-oldest / coalesce.
* **Fan-in / Merge**
  One reader per bed channel; all write into a merged channel. This is the central stream of samples.
* **Batcher**
  Window = `Interval`. Collects up to `patientCount` samples (or until window elapses). Emits a batch to a batch channel.
* **Broadcaster**
  Reads batches, calls `IVitalBroadcaster.PublishAsync`.
* **SignalR Broadcaster (Service)**
  Same as the actor version: buffer add, map DTO, push to hub.
* **Observability**
  Channel depth, drop counts, end-to-end latency, last push time.

**Flow**

1. Host wires channels and starts tasks.
2. Bed tasks tick → write samples to their bounded channels.
3. Merge fans in to a single stream.
4. Batcher emits time-boxed batches.
5. Broadcaster → service → hub.

**Why this works**

* Simpler mental model: tasks + channels.
* Back-pressure is explicit and natural via **bounded** channels.
* Fewer framework concepts; pure .NET primitives.

**Back-pressure**

* Bounded per-bed channels prevent unbounded lag. Choose a policy:

  * **Block**: slow sink throttles producers.
  * **Drop-oldest**: keep most recent data (useful for UI trends).
  * **Coalesce**: write latest only per window.

**Failure**

* No built-in supervision tree. Wrap bed loops in retry/restart; ensure channel completion on failure; propagate cancellation via `CancellationToken`.

**Scale lever**

* Single node: increase window or channel capacities.
* Multi-node: partition beds across services and use gRPC/Kafka/RabbitMQ between nodes. You implement partitioning and failover.

---

## Choosing for your brief (dev demo, 10–500 beds)

* **CSP**: lightest, strong back-pressure, minimal ceremony.
* **Akka.NET**: heavier setup, but gives supervision semantics and a clean path to clustering later.

Keep your boundaries (`IVitalSignalGenerator`, `IVitalBroadcaster`, `IVitalBuffer`) identical so you can swap implementations without touching the API.

# Vital Signals Generator - Concurrency Technicalities

## Overview
Requirements for implementing a concurrent vital signs generation system for hospital monitoring dashboard with real-time web client interaction.

## Core Concurrency Requirements

### 1. Multi-Bed Parallel Generation
- **Requirement**: Generate vitals for 10-500 beds simultaneously
- **Technical Need**: Each bed operates independently with its own timing and patterns
- **Implementation**: Parallel task execution without mutual blocking
- **Considerations**: Memory usage scaling, CPU distribution across beds

### 2. Real-time Interactive Control
- **Requirement**: Web client can trigger anomalies on specific beds instantly
- **Technical Need**: Accept HTTP commands while continuous generation is running
- **Implementation**: Multiple input sources per bed (timer + web commands)
- **Considerations**: Command prioritization, immediate response time

### 3. Efficient Batching & Broadcasting
- **Requirement**: Collect vitals from all beds → batch → SignalR broadcast
- **Technical Need**: Aggregate data from multiple producers to single consumer
- **Implementation**: Fan-in pattern with time-boxed batching
- **Considerations**: Batch size optimization, broadcast latency

### 4. Back-pressure Management
- **Requirement**: Handle slow consumers (database, SignalR clients)
- **Technical Need**: Fast generators shouldn't block on slow sinks
- **Implementation**: Bounded buffers with overflow policies
- **Options**:
  - **Drop oldest**: Keep most recent data for UI trends
  - **Block**: Throttle producers when consumers lag
  - **Coalesce**: Send only latest vital per window

### 5. Stateful Drift Coordination
- **Requirement**: Each bed maintains trending patterns (BP rising over time)
- **Technical Need**: Thread-safe per-bed state isolation + intra-bed correlation
- **Implementation**: Encapsulated state per bed with correlation logic
- **Considerations**: State persistence, pattern continuity

### 6. Crisis Injection & State Transitions
- **Requirement**: Inject realistic medical emergencies with progression
- **Technical Need**: Override normal patterns temporarily, then recovery
- **Implementation**: State machine with anomaly overrides
- **Considerations**: Anomaly duration, realistic medical progression, state cleanup

### 7. Performance Monitoring
- **Requirement**: Track generation rates, batch sizes, broadcast latency
- **Technical Need**: Non-blocking metrics collection during high-frequency operations
- **Implementation**: Lock-free counters, periodic sampling
- **Metrics**: Vitals/sec per bed, end-to-end latency, drop counts, channel depths

## Architecture Pattern
**Multi-producer, Single-consumer** with:
- **Producers**: Bed generators (10-500 parallel)
- **Consumer**: Batcher → Broadcaster → SignalR Hub
- **Control Plane**: Web API for anomaly injection
- **Back-pressure**: Bounded channels with configurable policies

## Technical Constraints
- **Latency Target**: <100ms from generation to SignalR broadcast
- **Throughput**: Support 1 Hz per bed (500 vitals/sec at max scale)
- **Memory**: Bounded growth with buffer limits
- **Reliability**: Individual bed failures don't affect others
- **Scalability**: Linear performance scaling with bed count

## Success Criteria
1. ✅ All beds generate independently without blocking
2. ✅ Web commands affect target beds instantly (<50ms)
3. ✅ SignalR clients receive batched updates within latency target
4. ✅ System remains stable under slow consumer scenarios
5. ✅ Per-bed state maintains realistic medical patterns
6. ✅ Crisis scenarios progress realistically over time
7. ✅ Performance metrics available without impact

---

## Implementation Options Considered
- **CSP (Tasks + Channels)**: .NET native, explicit back-pressure, minimal ceremony
- **Actor Model (Akka.NET)**: Supervision semantics, clustering path, heavier setup
- **Hosted Services + Events**: Traditional .NET patterns, familiar OOP approach

Each approach can satisfy the technical requirements above with different trade-offs in complexity, familiarity, and future scaling needs.
"""Replay clock. Agents read this, never the wall clock, so runs are repeatable."""
import time
from datetime import datetime, timedelta, timezone

SPEEDS = (1, 60, 1440)


def parse_ts(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def fmt_ts(d: datetime) -> str:
    return d.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class ReplayClock:
    def __init__(self, start: str, end: str, speed: int = 60, loop: bool = False, wall=time.monotonic):
        if speed not in SPEEDS:
            raise ValueError(f"speed must be one of {SPEEDS}")
        self.start, self.end = parse_ts(start), parse_ts(end)
        self.speed, self.loop, self._wall = speed, loop, wall
        self._anchor_sim, self._anchor_wall = self.start, wall()
        self.paused = False

    def now(self) -> datetime:
        if self.paused:
            return self._anchor_sim
        t = self._anchor_sim + timedelta(seconds=(self._wall() - self._anchor_wall) * self.speed)
        if t >= self.end:
            if not self.loop:
                return self.end
            span = self.end - self.start
            t = self.start + (t - self.start) % span
        return t

    def _rebase(self, sim: datetime):
        self._anchor_sim, self._anchor_wall = sim, self._wall()

    def pause(self):
        self._rebase(self.now())
        self.paused = True

    def resume(self):
        self._rebase(self._anchor_sim)
        self.paused = False

    def seek(self, ts: str):
        sim = parse_ts(ts)
        if not self.start <= sim <= self.end:
            raise ValueError("seek target outside the scenario window")
        self._rebase(sim)

    def set_speed(self, speed: int):
        if speed not in SPEEDS:
            raise ValueError(f"speed must be one of {SPEEDS}")
        self._rebase(self.now())
        self.speed = speed

    @property
    def finished(self) -> bool:
        return not self.loop and self.now() >= self.end

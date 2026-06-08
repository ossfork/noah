use anyhow::Result;
use async_trait::async_trait;
use serde_json::{json, Value};
use std::process::Command;

use noah_tools::{ChangeRecord, SafetyTier, Tool, ToolResult};

// ── MacSystemInfo ──────────────────────────────────────────────────────

pub struct MacSystemInfo;

#[async_trait]
impl Tool for MacSystemInfo {
    fn name(&self) -> &str {
        "mac_system_info"
    }

    fn description(&self) -> &str {
        "Get macOS version, CPU model, core count, and total memory."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {},
            "required": []
        })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::ReadOnly
    }

    async fn execute(&self, _input: &Value) -> Result<ToolResult> {
        let sw_vers = Command::new("sw_vers")
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_else(|e| format!("sw_vers failed: {}", e));

        let cpu_brand = Command::new("sysctl")
            .args(["-n", "machdep.cpu.brand_string"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|e| format!("sysctl failed: {}", e));

        let cpu_count = Command::new("sysctl")
            .args(["-n", "hw.ncpu"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|e| format!("sysctl failed: {}", e));

        let mem_bytes = Command::new("sysctl")
            .args(["-n", "hw.memsize"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|e| format!("sysctl failed: {}", e));

        let mem_gb = mem_bytes
            .parse::<u64>()
            .map(|b| format!("{} GB", b / (1024 * 1024 * 1024)))
            .unwrap_or_else(|_| mem_bytes.clone());

        let output = format!(
            "=== macOS Version ===\n{}\n=== CPU ===\n{} ({} cores)\n\n=== Memory ===\n{}",
            sw_vers.trim(),
            cpu_brand,
            cpu_count,
            mem_gb
        );

        Ok(ToolResult::read_only(
            output,
            json!({
                "sw_vers": sw_vers.trim(),
                "cpu": cpu_brand,
                "cores": cpu_count,
                "memory": mem_gb,
            }),
        ))
    }
}

// ── MacProcessList ─────────────────────────────────────────────────────

pub struct MacProcessList;

#[async_trait]
impl Tool for MacProcessList {
    fn name(&self) -> &str {
        "mac_process_list"
    }

    fn description(&self) -> &str {
        "List running processes sorted by CPU or memory usage."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "sort_by": {
                    "type": "string",
                    "description": "Sort by 'cpu' or 'mem' (default: cpu)",
                    "enum": ["cpu", "mem"],
                    "default": "cpu"
                }
            },
            "required": []
        })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::ReadOnly
    }

    async fn execute(&self, input: &Value) -> Result<ToolResult> {
        let sort_by = input["sort_by"].as_str().unwrap_or("cpu");
        let output = Command::new("ps")
            .args(["aux"])
            .output()
            .map(|o| {
                let stdout = String::from_utf8_lossy(&o.stdout).to_string();
                // Take header + top 25 processes
                let mut lines: Vec<&str> = stdout.lines().collect();
                if lines.len() > 26 {
                    lines.truncate(26);
                }
                lines.join("\n")
            })
            .unwrap_or_else(|e| format!("ps failed: {}", e));

        // Also get top output for a sorted view
        let top_output = Command::new("top")
            .args(["-l", "1", "-n", "20", "-o", if sort_by == "mem" { "mem" } else { "cpu" }, "-s", "0"])
            .output()
            .map(|o| {
                let stdout = String::from_utf8_lossy(&o.stdout).to_string();
                // Get the last section with the process list
                let lines: Vec<&str> = stdout.lines().collect();
                let start = lines.iter().position(|l| l.starts_with("PID")).unwrap_or(0);
                lines[start..].join("\n")
            })
            .unwrap_or_else(|e| format!("top failed: {}", e));

        let combined = format!(
            "=== Top Processes (sorted by {}) ===\n{}",
            sort_by, top_output
        );

        Ok(ToolResult::read_only(
            combined.clone(),
            json!({
                "sort_by": sort_by,
                "top_output": top_output.trim(),
                "ps_output": output.trim(),
            }),
        ))
    }
}

// ── MacDiskUsage ───────────────────────────────────────────────────────

pub struct MacDiskUsage;

#[async_trait]
impl Tool for MacDiskUsage {
    fn name(&self) -> &str {
        "mac_disk_usage"
    }

    fn description(&self) -> &str {
        "Show disk usage for all mounted volumes."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {},
            "required": []
        })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::ReadOnly
    }

    async fn execute(&self, _input: &Value) -> Result<ToolResult> {
        let output = Command::new("df")
            .arg("-h")
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_else(|e| format!("df failed: {}", e));

        Ok(ToolResult::read_only(
            output.clone(),
            json!({ "raw_output": output.trim() }),
        ))
    }
}

// ── MacKillProcess ─────────────────────────────────────────────────────

pub struct MacKillProcess;

#[async_trait]
impl Tool for MacKillProcess {
    fn name(&self) -> &str {
        "mac_kill_process"
    }

    fn description(&self) -> &str {
        "Kill a process by PID. Use signal 15 (SIGTERM) for graceful or 9 (SIGKILL) for force kill. Requires user approval."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {
                "pid": {
                    "type": "integer",
                    "description": "Process ID to kill"
                },
                "signal": {
                    "type": "integer",
                    "description": "Signal number: 15 for SIGTERM (graceful), 9 for SIGKILL (force). Default: 15",
                    "default": 15
                }
            },
            "required": ["pid"]
        })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::SafeAction
    }

    async fn execute(&self, input: &Value) -> Result<ToolResult> {
        let pid = input["pid"]
            .as_u64()
            .ok_or_else(|| anyhow::anyhow!("Missing required parameter: pid"))?;
        let signal = input["signal"].as_u64().unwrap_or(15);

        // Get process info before killing
        let ps_info = Command::new("ps")
            .args(["-p", &pid.to_string(), "-o", "pid,comm,%cpu,%mem"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
            .unwrap_or_default();

        let output = Command::new("kill")
            .args([&format!("-{}", signal), &pid.to_string()])
            .output()
            .map(|o| {
                if o.status.success() {
                    format!(
                        "Process {} killed with signal {}.\n\nProcess info:\n{}",
                        pid, signal, ps_info.trim()
                    )
                } else {
                    let stderr = String::from_utf8_lossy(&o.stderr).to_string();
                    format!("Failed to kill process {}: {}", pid, stderr.trim())
                }
            })
            .unwrap_or_else(|e| format!("kill failed: {}", e));

        Ok(ToolResult::with_changes(
            output.clone(),
            json!({ "pid": pid, "signal": signal }),
            vec![ChangeRecord {
                description: format!("Killed process {} with signal {}", pid, signal),
                undo_tool: String::new(),
                undo_input: json!(null),
            }],
        ))
    }
}

// ── MacClearCaches ─────────────────────────────────────────────────────

pub struct MacClearCaches;

#[async_trait]
impl Tool for MacClearCaches {
    fn name(&self) -> &str {
        "mac_clear_caches"
    }

    fn description(&self) -> &str {
        "Clear the user's ~/Library/Caches/ directory to free disk space."
    }

    fn input_schema(&self) -> Value {
        json!({
            "type": "object",
            "properties": {},
            "required": []
        })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::SafeAction
    }

    async fn execute(&self, _input: &Value) -> Result<ToolResult> {
        let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
        let caches_dir = format!("{}/Library/Caches", home);

        // Get size before clearing
        let before_size = Command::new("du")
            .args(["-sh", &caches_dir])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
            .unwrap_or_else(|_| "unknown".to_string());

        // Remove contents of Caches directory (not the directory itself)
        let output = Command::new("find")
            .args([&caches_dir, "-mindepth", "1", "-maxdepth", "1", "-exec", "rm", "-rf", "{}", ";"])
            .output()
            .map(|o| {
                if o.status.success() {
                    format!(
                        "Caches cleared successfully.\nBefore: {}",
                        before_size
                    )
                } else {
                    let stderr = String::from_utf8_lossy(&o.stderr).to_string();
                    format!("Some caches cleared (some may be in use): {}", stderr.trim())
                }
            })
            .unwrap_or_else(|e| format!("Failed to clear caches: {}", e));

        Ok(ToolResult::with_changes(
            output.clone(),
            json!({
                "caches_dir": caches_dir,
                "before_size": before_size,
            }),
            vec![ChangeRecord {
                description: format!("Cleared contents of {}", caches_dir),
                undo_tool: String::new(),
                undo_input: json!(null),
            }],
        ))
    }
}

// ── MacPerformanceDiagnose ─────────────────────────────────────────────
//
// One deterministic pass that classifies a "my Mac is slow" complaint, so
// the agent doesn't fan out 6-8 ad-hoc probes (mac_system_info +
// mac_process_list ×2 + mac_disk_usage + vm_stat + sysctl ×2 + uptime).
// Faster for the user, consistent every time, and far cheaper in tokens.
//
// Returns a `primary` classification plus the raw signals and the top
// memory/CPU offenders (with a `system` flag so the agent never offers to
// kill a protected process). Pure read-only system inspection.

/// Processes whose *basename* looks suspicious but is normal and must never
/// be killed. Mirrors the performance-forensics playbook caveats.
fn is_system_process(name: &str) -> bool {
    const PROTECTED: &[&str] = &[
        "kernel_task", "WindowServer", "mds", "mds_stores", "mdworker",
        "trustd", "backupd", "cloudd", "bird", "softwareupdated",
        "launchd", "logd", "coreaudiod", "spotlightknowledged",
    ];
    PROTECTED.iter().any(|p| name == *p || name.starts_with(p))
}

/// True if a full `ps comm=` path is a protected system process. `ps comm=`
/// returns the full executable path, so check both the basename against the
/// name list AND whether it lives in a system location (daemons under
/// /System, /usr/libexec, /usr/sbin, /usr/lib are OS-owned, not user apps).
fn is_system_path(full: &str) -> bool {
    let base = full.rsplit('/').next().unwrap_or(full);
    is_system_process(base)
        || full.starts_with("/System/")
        || full.starts_with("/usr/libexec/")
        || full.starts_with("/usr/sbin/")
        || full.starts_with("/usr/lib/")
}

/// Basename of a `ps comm=` path: "/Applications/Foo.app/.../Foo" → "Foo".
fn proc_basename(full: &str) -> String {
    full.rsplit('/').next().unwrap_or(full).to_string()
}

#[derive(Clone)]
struct ProcSample {
    pid: i64,
    name: String,
    cpu_pct: f64,
    mem_mb: f64,
    system: bool,
}

/// Parse `ps` output lines of the form `PID RSS_KB %CPU COMMAND_PATH`.
fn parse_proc_samples(ps_stdout: &str) -> Vec<ProcSample> {
    let mut out = Vec::new();
    for line in ps_stdout.lines() {
        let mut it = line.split_whitespace();
        let (Some(pid), Some(rss), Some(cpu)) = (it.next(), it.next(), it.next()) else {
            continue;
        };
        let full = it.collect::<Vec<_>>().join(" ");
        if full.is_empty() {
            continue;
        }
        let Ok(pid) = pid.parse::<i64>() else { continue };
        let rss_kb = rss.parse::<f64>().unwrap_or(0.0);
        let cpu_pct = cpu.parse::<f64>().unwrap_or(0.0);
        // `ps comm=` gives the full path; display the basename and decide
        // system-ness from the full path.
        out.push(ProcSample {
            pid,
            name: proc_basename(&full),
            cpu_pct,
            system: is_system_path(&full),
            mem_mb: rss_kb / 1024.0,
        });
    }
    out
}

/// Parse swap "used" GB from `sysctl -n vm.swapusage`
/// ("total = 3072.00M  used = 1234.50M  free = 1837.50M").
fn parse_swap_used_gb(swapusage: &str) -> f64 {
    for tok in swapusage.split_whitespace().collect::<Vec<_>>().windows(3) {
        if tok[0] == "used" && tok[1] == "=" {
            let v = tok[2].trim_end_matches(|c: char| !c.is_ascii_digit() && c != '.');
            let num = v.parse::<f64>().unwrap_or(0.0);
            return if tok[2].ends_with('G') {
                num
            } else if tok[2].ends_with('M') {
                num / 1024.0
            } else if tok[2].ends_with('K') {
                num / (1024.0 * 1024.0)
            } else {
                num / (1024.0 * 1024.0 * 1024.0) // bytes
            };
        }
    }
    0.0
}

/// Parse root-volume used percent from `df -k /` (capacity column, e.g. "93%").
fn parse_disk_used_pct(df_stdout: &str) -> i64 {
    for line in df_stdout.lines().skip(1) {
        for field in line.split_whitespace() {
            if let Some(num) = field.strip_suffix('%') {
                if let Ok(n) = num.parse::<i64>() {
                    return n;
                }
            }
        }
    }
    0
}

/// Days since boot from `sysctl -n kern.boottime`
/// ("{ sec = 1779999999, usec = 0 } ...").
fn parse_uptime_days(boottime: &str, now_secs: u64) -> i64 {
    if let Some(idx) = boottime.find("sec = ") {
        let rest = &boottime[idx + 6..];
        let secs: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(boot) = secs.parse::<u64>() {
            if now_secs > boot {
                return ((now_secs - boot) / 86_400) as i64;
            }
        }
    }
    0
}

pub struct MacPerformanceDiagnose;

#[async_trait]
impl Tool for MacPerformanceDiagnose {
    fn name(&self) -> &str {
        "mac_performance_diagnose"
    }

    fn description(&self) -> &str {
        "Diagnose why a Mac is slow in ONE call. Returns a primary cause \
         (memory / cpu / disk / thermal / healthy), the raw signals, and the \
         top memory and CPU processes (each flagged if it's a protected system \
         process that must not be killed). Prefer this over running \
         mac_system_info + mac_process_list + mac_disk_usage separately."
    }

    fn input_schema(&self) -> Value {
        json!({ "type": "object", "properties": {}, "required": [] })
    }

    fn safety_tier(&self) -> SafetyTier {
        SafetyTier::ReadOnly
    }

    async fn execute(&self, _input: &Value) -> Result<ToolResult> {
        // Thresholds — deterministic so the diagnosis never drifts.
        const CPU_RUNAWAY_PCT: f64 = 90.0;
        const SWAP_PRESSURE_GB: f64 = 1.0;
        const DISK_FULL_PCT: i64 = 90;
        const THERMAL_KERNEL_CPU_PCT: f64 = 50.0;

        let run = |cmd: &str, args: &[&str]| -> String {
            Command::new(cmd)
                .args(args)
                .output()
                .map(|o| String::from_utf8_lossy(&o.stdout).to_string())
                .unwrap_or_default()
        };

        // RAM total.
        let ram_total_gb = run("sysctl", &["-n", "hw.memsize"])
            .trim()
            .parse::<u64>()
            .map(|b| b as f64 / (1024.0 * 1024.0 * 1024.0))
            .unwrap_or(0.0);

        // Swap.
        let swap_used_gb = parse_swap_used_gb(&run("sysctl", &["-n", "vm.swapusage"]));

        // Disk.
        let disk_used_pct = parse_disk_used_pct(&run("df", &["-k", "/"]));

        // Uptime.
        let now_secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let uptime_days = parse_uptime_days(&run("sysctl", &["-n", "kern.boottime"]), now_secs);

        // Processes (single ps call covers both CPU and memory ranking).
        let procs = parse_proc_samples(&run("ps", &["-axo", "pid=,rss=,pcpu=,comm="]));
        let mut by_mem = procs.clone();
        by_mem.sort_by(|a, b| b.mem_mb.partial_cmp(&a.mem_mb).unwrap_or(std::cmp::Ordering::Equal));
        let mut by_cpu = procs.clone();
        by_cpu.sort_by(|a, b| b.cpu_pct.partial_cmp(&a.cpu_pct).unwrap_or(std::cmp::Ordering::Equal));

        let proc_json = |p: &ProcSample| {
            json!({
                "pid": p.pid,
                "name": p.name,
                "cpu_pct": (p.cpu_pct * 10.0).round() / 10.0,
                "mem_mb": p.mem_mb.round() as i64,
                "system": p.system,
            })
        };
        let top_memory: Vec<Value> = by_mem.iter().take(5).map(proc_json).collect();
        let top_cpu: Vec<Value> = by_cpu.iter().take(5).map(proc_json).collect();

        // Signals.
        let top_cpu_proc = by_cpu.first();
        let cpu_runaway = top_cpu_proc
            .map(|p| p.cpu_pct > CPU_RUNAWAY_PCT && !p.system)
            .unwrap_or(false);
        let thermal_throttle = by_cpu
            .iter()
            .find(|p| p.name == "kernel_task")
            .map(|p| p.cpu_pct > THERMAL_KERNEL_CPU_PCT)
            .unwrap_or(false);
        let memory_pressure = swap_used_gb >= SWAP_PRESSURE_GB;
        let disk_full = disk_used_pct >= DISK_FULL_PCT;

        // Primary classification by what the agent should tackle first.
        let primary = if cpu_runaway {
            "cpu"
        } else if memory_pressure {
            "memory"
        } else if disk_full {
            "disk"
        } else if thermal_throttle {
            "thermal"
        } else {
            "healthy"
        };

        // Human-readable summary.
        let headline = match primary {
            "cpu" => {
                let p = top_cpu_proc.unwrap();
                format!("Runaway process: {} is using {:.0}% CPU.", p.name, p.cpu_pct)
            }
            "memory" => format!(
                "Memory pressure: {:.1} GB swap in use on a {:.0} GB Mac.",
                swap_used_gb, ram_total_gb
            ),
            "disk" => format!("Disk nearly full: boot volume is {}% used.", disk_used_pct),
            "thermal" => "Thermal throttling: kernel_task is holding CPU to cool the Mac.".to_string(),
            _ => "No single bottleneck found — the Mac looks healthy.".to_string(),
        };
        let restart_hint = if uptime_days > 7 {
            format!(" Uptime is {} days — a restart is worth suggesting.", uptime_days)
        } else {
            String::new()
        };
        let output = format!(
            "Primary cause: {}\n{}{}\n\nRAM {:.0} GB · swap {:.1} GB · disk {}% · uptime {}d",
            primary, headline, restart_hint, ram_total_gb, swap_used_gb, disk_used_pct, uptime_days
        );

        Ok(ToolResult::read_only(
            output,
            json!({
                "primary": primary,
                "signals": {
                    "cpu_runaway": cpu_runaway,
                    "memory_pressure": memory_pressure,
                    "disk_full": disk_full,
                    "thermal_throttle": thermal_throttle,
                },
                "ram_total_gb": (ram_total_gb * 10.0).round() / 10.0,
                "swap_used_gb": (swap_used_gb * 100.0).round() / 100.0,
                "disk_used_pct": disk_used_pct,
                "uptime_days": uptime_days,
                "top_memory": top_memory,
                "top_cpu": top_cpu,
            }),
        ))
    }
}

#[cfg(test)]
mod diagnose_tests {
    use super::*;

    #[test]
    fn parses_proc_samples() {
        let s = "123 2400000 4.5 firefox\n456 1048576 120.0 ffmpeg\nbad line\n789 512 0.0 launchd";
        let p = parse_proc_samples(s);
        assert_eq!(p.len(), 3);
        assert_eq!(p[0].pid, 123);
        assert_eq!(p[0].name, "firefox");
        assert!(!p[0].system);
        assert!((p[0].mem_mb - 2343.75).abs() < 0.1); // 2400000 KB / 1024
        assert!((p[1].cpu_pct - 120.0).abs() < 0.01);
        assert!(p[2].system); // launchd is protected by name
    }

    #[test]
    fn parses_full_paths_to_basename_and_flags_system() {
        // `ps comm=` returns full paths. The regression that the live run
        // caught: WindowServer/mds under /System were flagged user-killable.
        let s = "1 100 1.0 /System/Library/PrivateFrameworks/SkyLight.framework/Resources/WindowServer\n\
                 2 200 2.0 /usr/libexec/syspolicyd\n\
                 3 300 3.0 /Users/x/.rustup/toolchains/x/bin/rustc\n\
                 4 400 4.0 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
        let p = parse_proc_samples(s);
        assert_eq!(p[0].name, "WindowServer");
        assert!(p[0].system, "WindowServer under /System must be system");
        assert_eq!(p[1].name, "syspolicyd");
        assert!(p[1].system, "/usr/libexec daemon must be system");
        assert_eq!(p[2].name, "rustc");
        assert!(!p[2].system, "user-installed rustc is not system");
        assert_eq!(p[3].name, "Google Chrome");
        assert!(!p[3].system, "user app is not system");
    }

    #[test]
    fn system_path_detection() {
        assert!(is_system_path("/System/Library/.../WindowServer"));
        assert!(is_system_path("/usr/sbin/mDNSResponder"));
        assert!(is_system_path("kernel_task")); // bare name in list
        assert!(!is_system_path("/Applications/Firefox.app/Contents/MacOS/firefox"));
        assert_eq!(proc_basename("/a/b/c/Foo"), "Foo");
        assert_eq!(proc_basename("Foo"), "Foo");
    }

    #[test]
    fn parses_swap_used_megabytes() {
        let s = "total = 3072.00M  used = 1234.50M  free = 1837.50M";
        assert!((parse_swap_used_gb(s) - 1.2056).abs() < 0.01);
    }

    #[test]
    fn parses_swap_used_gigabytes_and_zero() {
        assert!((parse_swap_used_gb("total = 4.00G  used = 2.50G  free = 1.50G") - 2.5).abs() < 0.01);
        assert_eq!(parse_swap_used_gb("total = 0.00M  used = 0.00M  free = 0.00M"), 0.0);
    }

    #[test]
    fn parses_disk_used_pct() {
        let df = "Filesystem 1024-blocks Used Available Capacity iused ifree %iused Mounted\n\
                  /dev/disk3s1s1 971350180 90000000 30000000 93% 500000 9999 5% /";
        assert_eq!(parse_disk_used_pct(df), 93);
    }

    #[test]
    fn parses_uptime_days() {
        let now = 1_780_000_000u64;
        // boot 10 days earlier
        let boot = now - 10 * 86_400;
        let s = format!("{{ sec = {}, usec = 0 }} Thu Jun  5 09:00:00 2026", boot);
        assert_eq!(parse_uptime_days(&s, now), 10);
    }

    #[test]
    fn protects_system_processes() {
        assert!(is_system_process("kernel_task"));
        assert!(is_system_process("WindowServer"));
        assert!(is_system_process("mds_stores"));
        assert!(!is_system_process("firefox"));
        assert!(!is_system_process("Google Chrome"));
    }
}

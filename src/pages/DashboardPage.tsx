import {
  Monitor,
  Globe,
  Power,
  Settings2,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import type { ActivityItem, Device, IpAddress } from "@/types/types";
import {
  initialDevices,
  initialIps,
  type SettingsBundle,
} from "@/data/admin-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocalNote, PageHeading, StatusBadge } from "@/components/admin/shared";
import { useEffect, useState } from "react";
import { deviceService } from "@/services/device-service";
import { useFetch } from "@/hooks/useFetch";
import Loading from "@/components/admin/Loading";
import { ipAddressService } from "@/services/ip-address-service";

export default function DashboardPage({
  settings,
  activity,
  navigate,
}: {
  settings: SettingsBundle;
  activity: ActivityItem[];
  navigate: (_path: string) => void;
}) {
  const [devices, setDevices] = useState(initialDevices);
  const [ips, setIps] = useState(initialIps);

  const {
    data: dataDevices,
    loading: loadingDevices,
    error: _,
  } = useFetch<Array<Device>>(() => deviceService.getAllDevices(), []);

  const {
    data: dataIps,
    loading: loadingIps,
    error: _Ips,
  } = useFetch<Array<IpAddress>>(() => ipAddressService.getAllIpAddress(), []);

  useEffect(() => {
    function fn() {
      if (dataDevices) {
        setDevices(dataDevices);
      }
      if (dataIps) {
        setIps(dataIps);
      }
    }
    fn();
  }, [dataDevices, dataIps]);

  const active = devices.filter((d) => d.status === "ACTIVE").length;

  if (loadingDevices || loadingIps) {
    return <Loading type="dialog" />;
  }

  return (
    <>
      <PageHeading
        title="Tổng quan hệ thống"
        description="Theo dõi thiết bị, địa chỉ IP và cấu hình trong một nơi."
        action={
          <span className="rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
            {settings.system.app_name} <span className="mx-2">·</span>
            <StatusBadge status={settings.system.status} />
          </span>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          {
            title: "Tổng thiết bị",
            value: devices.length,
            note: "Thiết bị đã đăng ký",
            icon: Monitor,
            color: "text-primary bg-primary/10",
          },
          {
            title: "Thiết bị đang bật",
            value: active,
            note: `${devices.length - active} thiết bị đã tắt`,
            icon: Power,
            color: "text-emerald-600 bg-emerald-500/10",
          },
          {
            title: "Địa chỉ IP",
            value: ips.length,
            note: `${ips.filter((ip) => ip.status === "ACTIVE").length} địa chỉ đang bật`,
            icon: Globe,
            color: "text-violet-500 bg-violet-500/10",
          },
          {
            title: "Nhóm cấu hình",
            value: 4,
            note: "System · Tool · Post · Comment",
            icon: Settings2,
            color: "text-amber-600 bg-amber-500/10",
          },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {s.title}
                </span>
                <span
                  className={`grid size-9 place-items-center rounded-lg ${s.color}`}
                >
                  <s.icon size={18} />
                </span>
              </div>
              <strong className="mt-3 block text-3xl font-semibold tracking-tight">
                {String(s.value).padStart(2, "0")}
              </strong>
              <p className="mt-2 text-xs text-muted-foreground">{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thiết bị</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/devices")}
            >
              Xem tất cả
              <ArrowUpRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Activity size={20} />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {active} / {devices.length} thiết bị đang bật
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Trạng thái kích hoạt theo dữ liệu hiện tại.
                </p>
              </div>
            </div>
            <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${devices.length ? (active / devices.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="divide-y">
              {devices.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Monitor size={17} className="text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{d.device_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {d.device_type} · {d.id}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {[
                { label: "Quản lý thiết bị", path: "/devices", icon: Monitor },
                { label: "Quản lý địa chỉ IP", path: "/ips", icon: Globe },
                {
                  label: "Cài đặt hệ thống",
                  path: "/settings/system",
                  icon: Settings2,
                },
              ].map((item) => (
                <Button
                  variant="outline"
                  className="h-11 justify-start"
                  key={item.path}
                  onClick={() => navigate(item.path)}
                >
                  <item.icon size={16} />
                  {item.label}
                  <ArrowUpRight size={14} className="ml-auto" />
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hoạt động trong phiên</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length ? (
                <ul className="space-y-4">
                  {activity.slice(0, 5).map((item) => (
                    <li
                      key={item.id}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <p className="text-xs leading-5">{item.text}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.time}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-3">
                  <p className="text-sm text-muted-foreground">
                    Chưa có thay đổi.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Các thao tác chỉnh sửa và bật/tắt sẽ xuất hiện tại đây.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <LocalNote />
    </>
  );
}

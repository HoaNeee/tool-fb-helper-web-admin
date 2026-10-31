import AlertComponent from "@/components/admin/AlertComponent";
import Loading from "@/components/admin/Loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import type { CustomError } from "@/utils/exception";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

export default function LoginPage() {
  const [error, setError] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const pathName = useLocation().pathname;

  const { login, state: authState } = useAuth();

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (authState.loading) return;
    if (authState.is_authenticated) {
      location.href = pathName;
    } else {
      if (pathName !== "/" && pathName !== "/login") location.href = "/login";
    }
  }, [authState.is_authenticated, authState.loading, pathName]);

  const handleLogin = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    setLoading(true);
    try {
      await login(username, password);
    } catch (error) {
      setError({
        title: "Đăng nhập thất bại",
        message: (error as CustomError).message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      {authState.loading || loading ? <Loading type="dialog" /> : null}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="w-full max-w-sm"
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Đăng nhập quản trị viên</CardTitle>
            <CardDescription>
              Nhập tên đăng nhập bên dưới để đăng nhập vào tài khoản
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="pt-2 pb-6">
                <AlertComponent
                  type="error"
                  title={error.title}
                  message={error.message}
                  showIcon={false}
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="user123, user456,..."
                  required
                  name="username"
                  tabIndex={1}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-xs underline-offset-4 hover:underline"
                  ></a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  name="password"
                  tabIndex={2}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full justify-center text-base">
              Đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

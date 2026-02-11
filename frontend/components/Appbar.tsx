"use client";
import { useRouter } from "next/navigation"
import { LinkButton } from "./buttons/LinkButton"
import { PrimaryButton } from "./buttons/PrimaryButton"
import axios from "axios"
import { useEffect, useState } from "react"
import { BACKEND_URL } from "@/app/config"

export const Appbar = () => {
    const router = useRouter();
    const [user, setUser] = useState<{ name: string | null; email: string } | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token || !token.trim()) {
            setAuthChecked(true);
            return;
        }
        axios.get(`${BACKEND_URL}/api/v1/user`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.data?.user) {
                    setUser(res.data.user);
                }
            })
            .catch(() => {
                // Token invalid or expired – clear it
                localStorage.removeItem("token");
            })
            .finally(() => setAuthChecked(true));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        router.push("/");
    };

    return <div className="flex border-b justify-between p-4">
        <div className="flex flex-col justify-center text-2xl font-extrabold">
            Zapier
        </div>
        <div className="flex items-center gap-4">
            <div className="pr-4">
                <LinkButton onClick={() => {}}>Contact Sales</LinkButton>
            </div>
            {authChecked && (
                user
                    ? <>
                        <span className="text-slate-600">
                            {user.name || user.email}
                        </span>
                        <LinkButton onClick={handleLogout}>Logout</LinkButton>
                    </>
                    : <>
                        <LinkButton onClick={() => router.push("/login")}>
                            Login
                        </LinkButton>
                        <PrimaryButton onClick={() => router.push("/signup")}>
                            Signup
                        </PrimaryButton>
                    </>
            )}
        </div>
    </div>
}
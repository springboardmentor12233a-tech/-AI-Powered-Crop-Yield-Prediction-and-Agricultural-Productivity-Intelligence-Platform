"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { getToken, getRole } from "@/lib/auth";

const ROLE_STYLES = {
  admin: "bg-lime-300/40 text-olive-800 border-lime-500",
  farmer: "bg-cream-100 text-charcoal-900 border-cream-200",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (getRole() !== "admin") {
      router.push("/");
      return;
    }

    fetch("http://127.0.0.1:5000/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setError("Could not load users."))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <Sidebar />
      <div className="flex-1 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl font-semibold text-charcoal-900 mb-1">
          Users
        </h1>
        <p className="text-charcoal-900/60 mb-8">
          Everyone registered on AgriVantage.
        </p>

        {loading && <p className="text-charcoal-900/50 text-sm">Loading...</p>}
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {users.length > 0 && (
          <div className="bg-white rounded-2xl border border-cream-200 shadow-lg shadow-charcoal-900/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-olive-700 text-lime-400">
                  <th className="text-left font-heading font-semibold px-5 py-3.5">ID</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Name</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Email</th>
                  <th className="text-left font-heading font-semibold px-5 py-3.5">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-t border-cream-100 hover:bg-lime-300/20 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-cream-100/30"
                    }`}
                  >
                    <td className="px-5 py-3.5 text-charcoal-900/60">{u.id}</td>
                    <td className="px-5 py-3.5 font-medium text-charcoal-900">{u.name}</td>
                    <td className="px-5 py-3.5 text-charcoal-900/80">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                          ROLE_STYLES[u.role] || "bg-zinc-100 text-zinc-800 border-zinc-300"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
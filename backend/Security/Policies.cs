using Microsoft.AspNetCore.Authorization;

namespace backend.Security;

public static class Policies
{
    public const string AdminOnly = "AdminOnly";
    public const string StaffAndUp = "StaffAndUp";   // Admin, Manager, Staff
    public const string ManagerAndUp = "ManagerAndUp"; // Admin, Manager

    public static void AddRolePolicies(AuthorizationOptions options)
    {
        options.AddPolicy(AdminOnly, p => p.RequireRole("Admin"));
        options.AddPolicy(ManagerAndUp, p => p.RequireRole("Admin", "Manager"));
        options.AddPolicy(StaffAndUp, p => p.RequireRole("Admin", "Manager", "Staff"));
    }
}

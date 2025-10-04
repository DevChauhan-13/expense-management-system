"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminApprovalRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    ruleName: "",
    isManagerApprover: true,
    approvalType: "sequential",
    percentageRequired: 50,
    specificApproverId: "",
    approvers: [] as Array<{ userId: number; sequenceOrder: number }>,
  });

  useEffect(() => {
    fetchRules();
    fetchUsers();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/approval-rules", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRules(data);
      } else {
        toast.error("Failed to fetch approval rules");
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast.error("Error loading approval rules");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter((u: any) => ["manager", "admin", "director", "CFO", "finance"].includes(u.role)));
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error loading users");
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/approval-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          ...formData,
          specificApproverId: formData.specificApproverId ? parseInt(formData.specificApproverId) : null,
        }),
      });

      if (response.ok) {
        toast.success("Approval rule created successfully!");
        setOpen(false);
        setFormData({
          ruleName: "",
          isManagerApprover: true,
          approvalType: "sequential",
          percentageRequired: 50,
          specificApproverId: "",
          approvers: [],
        });
        fetchRules();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create approval rule");
      }
    } catch (error) {
      console.error("Error creating rule:", error);
      toast.error("An error occurred while creating the rule");
    } finally {
      setLoading(false);
    }
  };

  const addApprover = () => {
    const newSequence = formData.approvers.length + 1;
    setFormData({
      ...formData,
      approvers: [...formData.approvers, { userId: 0, sequenceOrder: newSequence }],
    });
  };

  const removeApprover = (index: number) => {
    const newApprovers = formData.approvers.filter((_, i) => i !== index);
    // Reorder sequence
    const reordered = newApprovers.map((a, i) => ({ ...a, sequenceOrder: i + 1 }));
    setFormData({ ...formData, approvers: reordered });
  };

  const updateApprover = (index: number, userId: number) => {
    const newApprovers = [...formData.approvers];
    newApprovers[index].userId = userId;
    setFormData({ ...formData, approvers: newApprovers });
  };

  if (loading && rules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Approval Rules</CardTitle>
              <CardDescription>Configure expense approval workflows and conditions</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings2 className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Approval Rule</DialogTitle>
                  <DialogDescription>
                    Define how expenses should be approved within your organization
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRule} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      placeholder="e.g., Standard Approval Flow"
                      value={formData.ruleName}
                      onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="isManager">Manager as First Approver</Label>
                      <p className="text-xs text-gray-600">
                        Require employee's direct manager to approve first
                      </p>
                    </div>
                    <Switch
                      id="isManager"
                      checked={formData.isManagerApprover}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isManagerApprover: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="approvalType">Approval Type</Label>
                    <Select
                      value={formData.approvalType}
                      onValueChange={(value) => setFormData({ ...formData, approvalType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequential - One by one in order</SelectItem>
                        <SelectItem value="percentage">Percentage - X% must approve</SelectItem>
                        <SelectItem value="specific">Specific Approver - Auto-approve if one approves</SelectItem>
                        <SelectItem value="hybrid">Hybrid - Percentage OR Specific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(formData.approvalType === "percentage" || formData.approvalType === "hybrid") && (
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Percentage Required (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.percentageRequired}
                        onChange={(e) =>
                          setFormData({ ...formData, percentageRequired: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  )}

                  {(formData.approvalType === "specific" || formData.approvalType === "hybrid") && (
                    <div className="space-y-2">
                      <Label htmlFor="specificApprover">Specific Approver</Label>
                      <Select
                        value={formData.specificApproverId}
                        onValueChange={(value) => setFormData({ ...formData, specificApproverId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select approver" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name} - {user.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Approvers Sequence</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addApprover}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Approver
                      </Button>
                    </div>
                    {formData.approvers.map((approver, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline">Step {approver.sequenceOrder}</Badge>
                        <Select
                          value={approver.userId.toString()}
                          onValueChange={(value) => updateApprover(index, parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select approver" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name} - {user.role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeApprover(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Rule"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Settings2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No approval rules configured</p>
              <p className="text-sm mt-2">Create a rule to define expense approval workflows</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-lg">{rule.ruleName}</CardTitle>
                    <CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rule.isManagerApprover && (
                          <Badge variant="secondary">Manager First</Badge>
                        )}
                        <Badge>{rule.approvalType}</Badge>
                        {rule.percentageRequired && (
                          <Badge variant="outline">{rule.percentageRequired}% Required</Badge>
                        )}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Approval Sequence:</Label>
                      {rule.approvers && rule.approvers.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {rule.approvers.map((approver: any) => (
                            <div key={approver.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">Step {approver.sequenceOrder}</Badge>
                              <span className="text-gray-700">
                                {approver.user?.name} ({approver.user?.role})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No additional approvers configured</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
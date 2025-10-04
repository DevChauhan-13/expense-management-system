"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export default function ManagerApprovals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await fetch("/api/approvals", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApprovals(data);
      } else {
        toast.error("Failed to fetch approvals");
      }
    } catch (error) {
      console.error("Error fetching approvals:", error);
      toast.error("An error occurred while fetching approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (approvalId: number, status: "approved" | "rejected") => {
    setActionLoading(true);

    try {
      const response = await fetch("/api/approvals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify({
          approvalId,
          status,
          comments,
        }),
      });

      if (response.ok) {
        toast.success(`Expense ${status === "approved" ? "approved" : "rejected"} successfully`);
        setOpen(false);
        setComments("");
        setSelectedApproval(null);
        fetchApprovals();
      } else {
        toast.error(`Failed to ${status === "approved" ? "approve" : "reject"} expense`);
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>
            Review and approve or reject expense claims from your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No pending approvals</p>
              <p className="text-sm mt-2">All caught up!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium">
                      {approval.expense?.employee?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {approval.expense?.expenseDate
                        ? new Date(approval.expense.expenseDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{approval.expense?.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {approval.expense?.description}
                    </TableCell>
                    <TableCell>
                      {approval.expense?.convertedAmount
                        ? approval.expense.convertedAmount.toFixed(2)
                        : approval.expense?.amount?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Step {approval.sequenceOrder}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={open && selectedApproval?.id === approval.id}
                        onOpenChange={(isOpen) => {
                          setOpen(isOpen);
                          if (isOpen) {
                            setSelectedApproval(approval);
                          } else {
                            setSelectedApproval(null);
                            setComments("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Expense</DialogTitle>
                            <DialogDescription>
                              Review the expense details and provide your decision
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-gray-600">Employee</Label>
                                <p className="font-medium">{approval.expense?.employee?.name}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Date</Label>
                                <p className="font-medium">
                                  {approval.expense?.expenseDate
                                    ? new Date(approval.expense.expenseDate).toLocaleDateString()
                                    : "-"}
                                </p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Category</Label>
                                <p className="font-medium">{approval.expense?.category}</p>
                              </div>
                              <div>
                                <Label className="text-gray-600">Amount</Label>
                                <p className="font-medium">
                                  {approval.expense?.amount} {approval.expense?.originalCurrency}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-gray-600">Description</Label>
                                <p className="font-medium">{approval.expense?.description}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="comments">Comments (Optional)</Label>
                              <Textarea
                                id="comments"
                                placeholder="Add any comments about your decision..."
                                rows={3}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                className="flex-1"
                                onClick={() => handleAction(approval.id, "approved")}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                )}
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleAction(approval.id, "rejected")}
                                disabled={actionLoading}
                              >
                                {actionLoading ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, List, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Customer } from "../types";
import {getAllCustomers} from "../../../db";
import {sendSMS} from "../../../index";


const { Title } = Typography;

const CustomerList: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const showHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  useEffect(() => {
    const fun = async () => {
        const customerList: Customer[] = await getAllCustomers();
        if(customerList?.length)
        {
            setCustomers(customerList);
        }
    }
    fun();
  }, []);
 

  const sendSms = async(id: number) => {
    const response = await fetch("http://localhost:3000/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({id}),
      });
    
      if (!response.ok) {
        throw new Error("Failed to send SMS");
      }
      console.log(response)
      return response.json();
  };

  const columns: ColumnsType<Customer> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Phone",
      dataIndex: "mobile_number",
      key: "phone"
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email"
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="primary" style={{ marginRight: 8 }} onClick={() => sendSms(record?.id)}>
            Send
          </Button>
          <Button onClick={() => showHistory(record)}>History</Button>
        </>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Customer List</Title>
      <Table
        dataSource={customers}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
      />

      <Modal
        title={`Chat History - ${selectedCustomer?.name}`}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="close" danger onClick={handleCancel}>
            Close
          </Button>
        ]}
      >
        {selectedCustomer && (
          <List
            dataSource={selectedCustomer.chatHistory}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        )}
      </Modal>
    </div>
  );
};

export default CustomerList;

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Avatar, List, Tooltip, Tag, Button, Modal, Form, DatePicker, Select, message } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import supabase from '../../../supabase-client';
import { useAuth } from '../../context/AuthContext';

// --- Status Colors ---
const statusColors = {
  'not started': 'default',
  'started': 'orange',
  'delayed': 'red',
  'in progress': 'blue',
  'completed': 'green'
};

// --- Budget Section ---
const BudgetSection = ({ budget, onAdd, onEdit, onDelete, userId }) => (
  <Card title="Budget Breakup" extra={<Button type="primary" onClick={onAdd} icon={<PlusOutlined />}>Add Budget</Button>} style={{ marginBottom: 24 }}>
    {budget.length === 0 ? (
      <div>No budget items found</div>
    ) : (
      <List
        dataSource={budget}
        renderItem={item => (
          <List.Item
            actions={
              item.created_by === userId
                ? [
                    <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(item)} />,
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(item.id)} />
                  ]
                : []
            }
          >
            <div style={{ width: '100%' }}>
              <div style={{ fontWeight: 500 }}>{item.description}</div>
              <div style={{ display: 'flex', gap: 12, margin: '8px 0' }}>
                <Tag color="green">Planned: ${item.planned_amount}</Tag>
                <Tag color={item.actual_amount > item.planned_amount ? 'red' : 'blue'}>
                  Spent: ${item.actual_amount}
                </Tag>
              </div>
              {item.remarks && <div style={{ color: '#888', fontSize: 13 }}>{item.remarks}</div>}
            </div>
          </List.Item>
        )}
      />
    )}
    {/* Financial Health */}
    {budget.length > 0 && (
      <div style={{ marginTop: 16, fontWeight: 500 }}>
        Total Planned: <Tag color="green">${budget.reduce((a, b) => a + Number(b.planned_amount), 0)}</Tag>
        Total Spent: <Tag color="blue">${budget.reduce((a, b) => a + Number(b.actual_amount), 0)}</Tag>
      </div>
    )}
  </Card>
);

const BudgetForm = ({ visible, onCancel, onSubmit, initial }) => {
  const [form] = Form.useForm();
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(initial || { description: '', planned_amount: '', actual_amount: '', remarks: '' });
    }
  }, [visible, initial]);
  return (
    <Modal
      title={initial ? 'Edit Budget' : 'Add Budget'}
      open={visible}
      onOk={async () => {
        try {
          const values = await form.validateFields();
          onSubmit(values);
          form.resetFields();
        } catch (err) {
          message.error('Please fill all required fields.');
        }
      }}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText={initial ? 'Update' : 'Add'}
    >
      <Form form={form} layout="vertical">
      <Form.Item name="description" label="Description" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="planned_amount" label="Planned Amount" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="actual_amount" label="Actual Amount" rules={[{ required: true }]}>
          <Input type="number" />
        </Form.Item>
        <Form.Item name="remarks" label="Remarks">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Milestone Section ---
const MilestoneSection = ({ milestones = [], onAdd, onEdit, onDelete, userId }) => {
  const dotSize = 24;
  const lineWidth = 8;
  const cardSpacing = 56;
  const cardOffset = 32;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
      {/* Timeline line */}
      {milestones.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: cardOffset + dotSize / 2,
            left: 28 + (dotSize - lineWidth) / 2,
            width: lineWidth,
            height: cardSpacing * (milestones.length - 1),
            background: '#b3b3b3',
            borderRadius: 4,
            zIndex: 0,
          }}
        />
      )}
      {/* Dots */}
      {milestones.map((item, idx) => (
        <div
          key={'dot-' + idx}
          style={{
            position: 'absolute',
            top: cardOffset + idx * cardSpacing,
            left: 22,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: statusColors[item.status] === 'default' ? '#d9d9d9' : statusColors[item.status],
            border: '4px solid #fff',
            boxShadow: '0 0 0 2px #b3b3b3',
            zIndex: 1,
          }}
        />
      ))}
      {/* Milestone cards */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Project Milestones</span>
          <Button type="primary" onClick={onAdd} icon={<PlusOutlined />}>Add Milestone</Button>
        </div>
        {milestones.length === 0 ? (
          <div>No milestones found</div>
        ) : (
          milestones.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: cardSpacing }}>
              <div style={{ width: 60 }} /> {/* Spacer for timeline */}
              <Card
                size="small"
                style={{ flex: 1, borderLeft: `4px solid ${statusColors[item.status] || '#d9d9d9'}` }}
                styles={{ body: { padding: 12 } }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Tag color={statusColors[item.status]}>{item.status}</Tag>
                  <Tag color="blue" icon={<CalendarOutlined />}>{item.start_date} - {item.end_date}</Tag>
                  <Tag color="gold" icon={<CalendarOutlined />}>Expected: {item.expected_completion}</Tag>
                  <Tag color="purple" icon={<UserOutlined />}>{item.creator?.name || 'Unknown'}</Tag>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    {item.created_by === userId && (
                      <>
                        <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(item)} />
                        <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(item.id)} />
                      </>
                    )}
                  </div>
                </div>
                {item.remarks && <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{item.remarks}</div>}
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MilestoneForm = ({ visible, onCancel, onSubmit, initial }) => {
  const [form] = Form.useForm();
  useEffect(() => {
    if (visible) {
      if (initial) {
        form.setFieldsValue({
          ...initial,
          start_date: initial.start_date ? moment(initial.start_date) : null,
          end_date: initial.end_date ? moment(initial.end_date) : null,
          expected_completion: initial.expected_completion ? moment(initial.expected_completion) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, initial]);
  return (
    <Modal
      title={initial ? 'Edit Milestone' : 'Add Milestone'}
      open={visible}
      onOk={async () => {
        try {
          const values = await form.validateFields();
          onSubmit(values);
          form.resetFields();
        } catch (err) {
          message.error('Please fill all required fields.');
        }
      }}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText={initial ? 'Update' : 'Add'}
    >
      <Form form={form} layout="vertical">
      <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
          <Select placeholder="Select status">
            <Select.Option value="not started">Not Started</Select.Option>
            <Select.Option value="started">Started</Select.Option>
            <Select.Option value="delayed">Delayed</Select.Option>
            <Select.Option value="in progress">In Progress</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="start_date" label="Start Date" rules={[{ required: true, message: 'Please select a start date' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="end_date" label="End Date" rules={[{ required: true, message: 'Please select an end date' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="expected_completion" label="Expected Completion" rules={[{ required: true, message: 'Please select an expected completion date' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="remarks" label="Remarks">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// --- Team Avatars ---
const TeamAvatars = ({ team = [] }) => (
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 16 }}>
    {team.map((member, i) => (
      <Tooltip title={member.name} key={i}>
        <Avatar icon={<UserOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }}>{member.name[0]}</Avatar>
      </Tooltip>
    ))}
  </div>
);

// --- Budget & Milestone Wrapper ---
const BudgetMilestoneWrapper = ({ children }) => (
  <Card style={{ marginBottom: 24, border: '1px solid #e6e6e6', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
    {children}
  </Card>
);

const EmployeeProjects = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTeam, setSelectedProjectTeam] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [budgetModal, setBudgetModal] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  // Fetch projects assigned to this employee
  useEffect(() => {
    if (userId) {
      fetchEmployeeProjects(userId);
    }
  }, [userId]);

  // Fetch budgets and milestones when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      fetchBudgets(selectedProject.id);
      fetchMilestones(selectedProject.id);
      fetchProjectTeam(selectedProject.id).then(team => setSelectedProjectTeam(team));
    } else {
      setBudgets([]);
      setMilestones([]);
      setSelectedProjectTeam([]);
    }
  }, [selectedProject]);

  // Fetch projects where the employee is a team member
  const fetchEmployeeProjects = async (employeeId) => {
    // Get all project_team rows for this employee
    const { data: teamRows, error: teamError } = await supabase
      .from('project_team')
      .select('project_id')
      .eq('member_id', employeeId);
    if (teamError || !teamRows) {
      setProjects([]);
      setSelectedProject(null);
      return;
    }
    const projectIds = teamRows.map(row => row.project_id);
    if (projectIds.length === 0) {
      setProjects([]);
      setSelectedProject(null);
      return;
    }
    // Fetch project details for these IDs
    const { data, error } = await supabase
      .from('projects')
      .select(`*, lead:lead_id(id, name, email), created_by_member:created_by(id, name, email)`)
      .in('id', projectIds)
      .order('created_at', { ascending: false });
    if (!error && data) {
      // Fetch team counts for each project
      const projectsWithTeamCounts = await Promise.all(
        data.map(async (project) => {
          const { count, error: countError } = await supabase
            .from('project_team')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);
          return {
            ...project,
            team_count: countError ? 0 : (count || 0)
          };
        })
      );
      setProjects(projectsWithTeamCounts);
      setSelectedProject(projectsWithTeamCounts[0] || null);
    } else {
      setProjects([]);
      setSelectedProject(null);
    }
  };

  // Fetch team members for a project
  const fetchProjectTeam = async (projectId) => {
    const { data, error } = await supabase
      .from('project_team')
      .select(`member_id, member:member_id(id, name, email)`)
      .eq('project_id', projectId);
    if (!error && data) {
      return data.map(item => item.member);
    }
    return [];
  };

  // Fetch budgets for a project
  const fetchBudgets = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_budget')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (!error) setBudgets(data);
    } catch (error) {
      setBudgets([]);
    }
  };

  // Fetch milestones for a project
  const fetchMilestones = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_milestone')
        .select(`*, creator:created_by(id, name, email)`)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      if (!error) setMilestones(data);
    } catch (error) {
      setMilestones([]);
    }
  };

  // Budget CRUD
  const handleAddBudget = () => { setEditingBudget(null); setBudgetModal(true); };
  const handleEditBudget = (item) => { setEditingBudget(item); setBudgetModal(true); };
  const handleDeleteBudget = async (id) => {
    try {
      const { error } = await supabase
        .from('project_budget')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (selectedProject) fetchBudgets(selectedProject.id);
    } catch (err) {
      message.error('Failed to delete budget.');
      console.error(err);
    }
  };
  const handleSubmitBudget = async (values) => {
    try {
      if (editingBudget) {
        if (editingBudget.created_by !== userId) return;
        const payload = {
          description: values.description,
          planned_amount: Number(values.planned_amount),
          actual_amount: Number(values.actual_amount),
          remarks: values.remarks
        };
        const { error } = await supabase
          .from('project_budget')
          .update(payload)
          .eq('id', editingBudget.id);
        if (error) throw error;
        if (selectedProject) fetchBudgets(selectedProject.id);
      } else {
        const payload = {
          description: values.description,
          planned_amount: Number(values.planned_amount),
          actual_amount: Number(values.actual_amount),
          remarks: values.remarks,
          project_id: selectedProject.id
        };
        const { error } = await supabase
          .from('project_budget')
          .insert([payload]);
        if (error) throw error;
        if (selectedProject) fetchBudgets(selectedProject.id);
      }
      setBudgetModal(false);
      setEditingBudget(null);
    } catch (err) {
      message.error('Failed to save budget.');
      console.error(err);
    }
  };

  // Milestone CRUD
  const handleAddMilestone = () => { setEditingMilestone(null); setMilestoneModal(true); };
  const handleEditMilestone = (item) => { setEditingMilestone(item); setMilestoneModal(true); };
  const handleDeleteMilestone = async (id) => {
    try {
      const { error } = await supabase
        .from('project_milestone')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (selectedProject) fetchMilestones(selectedProject.id);
    } catch (err) {
      message.error('Failed to delete milestone.');
      console.error(err);
    }
  };
  const handleSubmitMilestone = async (values) => {
    try {
      if (editingMilestone) {
        if (editingMilestone.created_by !== userId) return;
        const payload = {
          description: values.description,
          status: values.status,
          start_date: values.start_date?.format('YYYY-MM-DD'),
          end_date: values.end_date?.format('YYYY-MM-DD'),
          expected_completion: values.expected_completion?.format('YYYY-MM-DD'),
          remarks: values.remarks
        };
        const { error } = await supabase
          .from('project_milestone')
          .update(payload)
          .eq('id', editingMilestone.id);
        if (error) throw error;
        if (selectedProject) fetchMilestones(selectedProject.id);
      } else {
        const payload = {
          description: values.description,
          status: values.status,
          start_date: values.start_date?.format('YYYY-MM-DD'),
          end_date: values.end_date?.format('YYYY-MM-DD'),
          expected_completion: values.expected_completion?.format('YYYY-MM-DD'),
          remarks: values.remarks,
          project_id: selectedProject.id,
          created_by: userId
        };
        const { error } = await supabase
          .from('project_milestone')
          .insert([payload]);
        if (error) throw error;
        if (selectedProject) fetchMilestones(selectedProject.id);
      }
      setMilestoneModal(false);
      setEditingMilestone(null);
    } catch (err) {
      message.error('Failed to save milestone.');
      console.error(err);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Row gutter={24} style={{ minHeight: '80vh' }}>
      {/* Left: Project List */}
      <Col xs={24} sm={10} md={8} lg={7} xl={6} style={{ background: '#f7f9fa', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Input
            placeholder="Search projects..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginRight: 8 }}
          />
        </div>
        <List
          dataSource={filteredProjects}
          renderItem={project => (
            <Card
              key={project.id}
              style={{ marginBottom: 12, border: selectedProject?.id === project.id ? '2px solid #1890ff' : undefined, cursor: 'pointer' }}
              onClick={() => setSelectedProject(project)}
              styles={{ body: { padding: 16 } }}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{project.title}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>{project.description}</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag color="blue" icon={<UserOutlined />}>{project.lead?.name || 'N/A'}</Tag>
                    <Tag color="orange" icon={<CalendarOutlined />}>{project.expected_completion}</Tag>
                    <Tag color="green" icon={<TeamOutlined />}>{project.team_count} members</Tag>
                  </div>
                </div>
              </div>
            </Card>
          )}
        />
      </Col>

      {/* Right: Project Details */}
      <Col xs={24} sm={14} md={16} lg={17} xl={18} style={{ padding: 16 }}>
        {selectedProject && (
          <>
            <TeamAvatars team={selectedProjectTeam} />
            <BudgetMilestoneWrapper>
              <BudgetSection
                budget={budgets}
                onAdd={handleAddBudget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
                userId={userId}
              />
              <MilestoneSection
                milestones={milestones}
                onAdd={handleAddMilestone}
                onEdit={handleEditMilestone}
                onDelete={handleDeleteMilestone}
                userId={userId}
              />
            </BudgetMilestoneWrapper>
            <BudgetForm
              visible={budgetModal}
              onCancel={() => setBudgetModal(false)}
              onSubmit={handleSubmitBudget}
              initial={editingBudget}
            />
            <MilestoneForm
              visible={milestoneModal}
              onCancel={() => setMilestoneModal(false)}
              onSubmit={handleSubmitMilestone}
              initial={editingMilestone}
            />
          </>
        )}
      </Col>
    </Row>
  );
};

export default EmployeeProjects;
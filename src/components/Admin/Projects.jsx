import React, { useState } from 'react';
import { Row, Col, Card, Button, Input, Modal, Form, DatePicker, Select, Avatar, List, Tooltip, Tag, Timeline } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, TeamOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import supabase from '../../../supabase-client';

const statusColors = {
  'not started': 'default',
  'started': 'orange',
  'delayed': 'red',
  'in progress': 'blue',
  'completed': 'green'
};

const { Option } = Select;

// --- Budget Section ---
const BudgetSection = ({ budget, onAdd, onEdit, onDelete }) => (
  <Card
    title="Budget Breakup"
    extra={<Button type="primary" onClick={onAdd}>+ Add Budget</Button>}
    style={{ marginBottom: 24 }}
  >
    {budget.length === 0 ? (
      <div>No budget items found</div>
    ) : (
      <List
        dataSource={budget}
        renderItem={item => (
          <List.Item
            actions={[
              <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(item)} />,
              <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(item.id)} />
            ]}
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

// --- Budget Form Modal ---
const BudgetForm = ({ visible, onCancel, onSubmit, initial }) => {
  const [form] = Form.useForm();
  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue(initial || { description: '', planned_amount: '', actual_amount: '', remarks: '' });
    }
  }, [visible, initial]);
  return (
    <Modal
      title={initial ? 'Edit Budget' : 'Add Budget'}
      open={visible}
      onOk={() => form.validateFields().then(values => { onSubmit(values); form.resetFields(); })}
      onCancel={onCancel}
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

// --- Milestone Section with Timeline ---
const MilestoneSection = ({ milestones = [], onAdd, onEdit, onDelete }) => {
  const dotSize = 24;
  const lineWidth = 8;
  const cardSpacing = 56; // vertical space between cards
  const cardOffset = 32;  // vertical offset for the first card

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
          <Button type="primary" onClick={onAdd}>+ Add Milestone</Button>
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
                {/* Description at the top */}
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Tag color={statusColors[item.status]}>{item.status}</Tag>
                  <Tag color="blue" icon={<CalendarOutlined />}>{item.start_date} - {item.end_date}</Tag>
                  <Tag color="gold" icon={<CalendarOutlined />}>Expected: {item.expected_completion}</Tag>
                  <Tag color="purple" icon={<UserOutlined />}>{item.creator?.name || 'Unknown'}</Tag>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button icon={<EditOutlined />} size="small" onClick={() => onEdit(item)} />
                    <Button icon={<DeleteOutlined />} size="small" danger onClick={() => onDelete(item.id)} />
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

// --- Milestone Form Modal (with moment fix) ---
const MilestoneForm = ({ visible, onCancel, onSubmit, initial }) => {
  const [form] = Form.useForm();
  React.useEffect(() => {
    if (visible) {
      if (initial) {
        form.setFieldsValue({
          ...initial,
          start_date: initial.start_date ? moment(initial.start_date) : null,
          end_date: initial.end_date ? moment(initial.end_date) : null,
          expected_completion: initial.expected_completion ? moment(initial.expected_completion) : null,
        });
      } else {
        form.resetFields(); // This ensures all fields are undefined/null
      }
    }
  }, [visible, initial]);
  return (
    <Modal
      title={initial ? 'Edit Milestone' : 'Add Milestone'}
      open={visible}
      onOk={() => {
        form
          .validateFields()
          .then(values => {
            onSubmit(values);
            form.resetFields();
          });
      }}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      okText={initial ? 'Update' : 'Add'}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select a status' }]}>
          <Select>
            <Option value="not started">Not Started</Option>
            <Option value="started">Started</Option>
            <Option value="delayed">Delayed</Option>
            <Option value="in progress">In Progress</Option>
            <Option value="completed">Completed</Option>
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

// --- Budget & Milestone Wrapper ---
const BudgetMilestoneWrapper = ({ children }) => (
  <Card style={{ marginBottom: 24, border: '1px solid #e6e6e6', borderRadius: 8, boxShadow: '0 2px 8px #f0f1f2' }}>
    {children}
  </Card>
);

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

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [isEdit, setIsEdit] = useState(false);
  const [members, setMembers] = useState([]); // Add members state
  const [selectedProjectTeam, setSelectedProjectTeam] = useState([]); // Add team state for selected project

  const [budgets, setBudgets] = useState([]); // Flat array for current project
  const [milestones, setMilestones] = useState([]); // Flat array for current project
  const [budgetModal, setBudgetModal] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);

  // Fetch all projects and members on mount
  React.useEffect(() => {
    fetchProjects();
    fetchMembers();
  }, []);

  // Fetch budgets and milestones when selectedProject changes
  React.useEffect(() => {
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

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        lead:lead_id(id, name, email),
        created_by_member:created_by(id, name, email)
      `)
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
    }
  };

  // Fetch all members from Supabase
  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('member')
      .select('id, name, email')
      .order('name');
    if (!error) {
      setMembers(data || []);
    }
  };

  // Fetch team members for a project
  const fetchProjectTeam = async (projectId) => {
    const { data, error } = await supabase
      .from('project_team')
      .select(`
        member_id,
        member:member_id(id, name, email)
      `)
      .eq('project_id', projectId);
    if (!error) {
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
      // Table might not exist yet, set empty array
      setBudgets([]);
    }
  };

  // Fetch milestones for a project
  const fetchMilestones = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from('project_milestone')
        .select(`
          *,
          creator:created_by(id, name, email)
        `)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      if (!error) setMilestones(data);
    } catch (error) {
      // Table might not exist yet, set empty array
      setMilestones([]);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  // Open modal for new or edit
  const openModal = async (project = null) => {
    setIsEdit(!!project);
    setIsModalOpen(true);
    if (project) {
      // Fetch team members for this project
      const teamMembers = await fetchProjectTeam(project.id);
      const teamMemberIds = teamMembers.map(member => member.id);
      
      form.setFieldsValue({
        ...project,
        expected_completion: project.expected_completion ? moment(project.expected_completion) : null,
        lead: project.lead_id,
        team: teamMemberIds
      });
    } else {
      form.resetFields();
    }
  };

  // Handle create/edit project (Supabase)
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        title: values.title,
        description: values.description,
        expected_completion: values.expected_completion?.format('YYYY-MM-DD'),
        lead_id: values.lead,
        created_by: user?.id
      };

      if (isEdit && selectedProject) {
        // Update project
        const { error: projectError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', selectedProject.id);
        
        if (projectError) {
          console.error('Error updating project:', projectError);
          return;
        }

        // Update team members
        const { error: teamDeleteError } = await supabase
          .from('project_team')
          .delete()
          .eq('project_id', selectedProject.id);
        
        if (teamDeleteError) {
          console.error('Error deleting old team members:', teamDeleteError);
        }

        // Insert new team members
        if (values.team && values.team.length > 0) {
          const teamPayload = values.team.map(memberId => ({
            project_id: selectedProject.id,
            member_id: memberId
          }));
          
          const { error: teamInsertError } = await supabase
            .from('project_team')
            .insert(teamPayload);
          
          if (teamInsertError) {
            console.error('Error inserting team members:', teamInsertError);
          }
        }
        
        await fetchProjects();
        setIsModalOpen(false);
      } else {
        // Insert new project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert([payload])
          .select()
          .single();
        
        if (projectError) {
          console.error('Error creating project:', projectError);
          return;
        }

        // Insert team members for new project
        if (newProject && values.team && values.team.length > 0) {
          const teamPayload = values.team.map(memberId => ({
            project_id: newProject.id,
            member_id: memberId
          }));
          
          const { error: teamInsertError } = await supabase
            .from('project_team')
            .insert(teamPayload);
          
          if (teamInsertError) {
            console.error('Error inserting team members:', teamInsertError);
          }
        }
        
        await fetchProjects();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error in handleOk:', error);
    }
  };

  // Handle delete project
  const handleDelete = async (id) => {
    // Delete team members first (cascade should handle this, but being explicit)
    await supabase
      .from('project_team')
      .delete()
      .eq('project_id', id);
    
    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (!error) {
      fetchProjects();
    }
  };

  // Budget CRUD
  const handleAddBudget = () => { setEditingBudget(null); setBudgetModal(true); };
  const handleEditBudget = (item) => { setEditingBudget(item); setBudgetModal(true); };
  const handleDeleteBudget = async (id) => {
    const { error } = await supabase
      .from('project_budget')
      .delete()
      .eq('id', id);
    if (!error && selectedProject) fetchBudgets(selectedProject.id);
  };
  const handleSubmitBudget = async (values) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Budget form values:', values); // Debug log
    console.log('Selected project:', selectedProject); // Debug log
    console.log('Current user:', user); // Debug log
    
    if (editingBudget) {
      // Update existing budget
      const payload = {
        description: values.description,
        planned_amount: Number(values.planned_amount),
        actual_amount: Number(values.actual_amount),
        remarks: values.remarks
      };
      
      console.log('Update budget payload:', payload); // Debug log
      
      const { error } = await supabase
        .from('project_budget')
        .update(payload)
        .eq('id', editingBudget.id);
      if (!error && selectedProject) fetchBudgets(selectedProject.id);
    } else {
      // Insert new budget
      const payload = {
        description: values.description,
        planned_amount: Number(values.planned_amount),
        actual_amount: Number(values.actual_amount),
        remarks: values.remarks,
        project_id: selectedProject.id
      };
      
      console.log('Insert budget payload:', payload); // Debug log
      
      const { error } = await supabase
        .from('project_budget')
        .insert([payload]);
      
      if (error) {
        console.error('Budget insert error:', error); // Debug log
      } else {
        console.log('Budget inserted successfully'); // Debug log
      }
      
      if (!error && selectedProject) fetchBudgets(selectedProject.id);
    }
    setBudgetModal(false);
    setEditingBudget(null);
  };

  // Milestone CRUD
  const handleAddMilestone = () => { setEditingMilestone(null); setMilestoneModal(true); };
  const handleEditMilestone = (item) => { setEditingMilestone(item); setMilestoneModal(true); };
  const handleDeleteMilestone = async (id) => {
    const { error } = await supabase
      .from('project_milestone')
      .delete()
      .eq('id', id);
    if (!error && selectedProject) fetchMilestones(selectedProject.id);
  };
  const handleSubmitMilestone = async (values) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (editingMilestone) {
      // Update existing milestone
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
      if (!error && selectedProject) fetchMilestones(selectedProject.id);
    } else {
      // Insert new milestone
      const payload = {
        description: values.description,
        status: values.status,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
        expected_completion: values.expected_completion?.format('YYYY-MM-DD'),
        remarks: values.remarks,
        project_id: selectedProject.id,
        created_by: user?.id
      };
      
      const { error } = await supabase
        .from('project_milestone')
        .insert([payload]);
      if (!error && selectedProject) fetchMilestones(selectedProject.id);
    }
    setMilestoneModal(false);
    setEditingMilestone(null);
  };

  const currentBudget = budgets;
  const currentMilestones = milestones;

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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Project
          </Button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button icon={<EditOutlined />} size="small" onClick={e => { e.stopPropagation(); openModal(project); }} />
                  <Button icon={<DeleteOutlined />} size="small" danger onClick={e => { e.stopPropagation(); handleDelete(project.id); }} />
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
                budget={currentBudget}
                onAdd={handleAddBudget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
              />
              <MilestoneSection
                milestones={currentMilestones}
                onAdd={handleAddMilestone}
                onEdit={handleEditMilestone}
                onDelete={handleDeleteMilestone}
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

      {/* Project Create/Edit Modal */}
      <Modal
        title={isEdit ? 'Edit Project' : 'Create Project'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        okText={isEdit ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please enter a description' }]}> 
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="expected_completion" label="Expected Completion Date" rules={[{ required: true, message: 'Please select a date' }]}> 
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lead" label="Project Lead" rules={[{ required: true, message: 'Please select a project lead' }]}> 
            <Select placeholder="Select project lead" style={{ width: '100%' }}>
              {members.map(member => (
                <Option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="team" label="Team Members" rules={[{ required: true, message: 'Please select at least one team member' }]}> 
            <Select mode="multiple" placeholder="Select team members" style={{ width: '100%' }}>
              {members.map(member => (
                <Option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  );
};

export default Projects;
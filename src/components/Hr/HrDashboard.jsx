import React, { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import DonutCard from './DonutCard';
import MemberList from './MemberList';
import {
	Chart as ChartJS,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import supabase from '../../../supabase-client';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip);

const mockMembers = [
	{
		name: 'Theo Lawrence',
		email: 'theo.lawrence@gmail.com',
		type: 'Fulltime',
		department: 'Product Design',
		status: 'Absent',
		date: '12 Oct 2025',
		avatar: '/src/data/avatar.jpg',
	},
	{
		name: 'Anita Elizabeth',
		email: 'elizabethanita@gmail.com',
		type: 'Freelance',
		department: 'Development',
		status: 'Invited',
		date: '6 Nov 2025',
		avatar: '/src/data/avatar2.jpg',
	},
];

const donutLegend = [
	{ color: '#fb923c', value: 206, text: 'Fulltime' },
	{ color: '#22c55e', value: 48, text: 'Remote' },
	{ color: '#fb923c', value: '+2', text: 'Intern' },
	{ color: '#22c55e', value: '+3', text: 'Onboarding' },
];

const HrDashboard = () => {
	const [attendanceData, setAttendanceData] = useState([]);

	useEffect(() => {
		fetchAttendanceData();
	}, []);

	const fetchAttendanceData = async () => {
		try {
			const { data, error } = await supabase
				.from('attendance')
				.select('check_in, check_out');

			if (error) throw error;

			const formattedData = data
				.filter((record) => record.check_in && record.check_out) // Exclude invalid records
				.map((record) => {
					const checkIn = new Date(record.check_in);
					const checkOut = new Date(record.check_out);

					if (isNaN(checkIn) || isNaN(checkOut)) return null; // Exclude invalid dates

					const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60); // Convert milliseconds to hours
					return { date: checkIn, hoursWorked };
				})
				.filter((entry) => entry !== null); // Remove null entries

			formattedData.sort((a, b) => a.date - b.date); // Sort by date

			setAttendanceData(formattedData);
		} catch (error) {
			console.error('Error fetching attendance data:', error);
		}
	};

	const chartData = {
		labels: attendanceData.map((entry) => entry.date.toLocaleDateString()), // Use formatted dates as labels
		datasets: [
			{
				label: 'Average Work Hours',
				data: attendanceData.map((entry) => entry.hoursWorked),
				backgroundColor: 'rgba(79, 70, 229, 0.6)',
				borderColor: '#4F46E5',
				borderWidth: 1,
			},
		],
	};

	const chartOptions = {
		responsive: true,
		maintainAspectRatio: false, // Allow the chart to grow vertically
		plugins: {
			legend: {
				display: true,
				position: 'top',
				labels: {
					color: '#4F46E5',
					font: {
						size: 14,
						weight: 'bold',
					},
				},
			},
			tooltip: {
				backgroundColor: '#4F46E5',
				titleColor: '#fff',
				bodyColor: '#fff',
				borderColor: '#fff',
				borderWidth: 1,
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				min: 0, // Ensure no negative values are displayed
				title: {
					display: true,
					text: 'Hours',
					color: '#4F46E5',
					font: {
						size: 16,
						weight: 'bold',
					},
				},
				grid: {
					color: 'rgba(79, 70, 229, 0.1)',
				},
				ticks: {
					color: '#4F46E5',
					font: {
						size: 12,
					},
				},
			},
			x: {
				title: {
					display: true,
					text: 'Days',
					color: '#4F46E5',
					font: {
						size: 16,
						weight: 'bold',
					},
				},
				grid: {
					color: 'rgba(79, 70, 229, 0.1)',
				},
				ticks: {
					color: '#4F46E5',
					font: {
						size: 12,
					},
				},
			},
		},
	};

	return (
		<div className="p-4 md:p-8 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
				<h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
				<div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow border">
					<FaSearch className="text-gray-400" />
					<input
						className="outline-none bg-transparent ml-2"
						placeholder="Search"
					/>
				</div>
			</div>
			{/* Main Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column */}
				<div className="lg:col-span-2 flex flex-col gap-6">
					{/* Top Row: Avg Work Hours + Member Type */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Avg Work Hours Chart */}
						<div className="col-span-2">
							<ChartCard
								title="Avg. Work Hours"
								subtitle="8 Nov 2024 - 14 Nov 2024 | Last 7 days"
								className="h-[650px]" // Increase card height
							>
								<div className="relative h-[400px]" style={{ padding: '20px' }}> {/* Reduce graph height */}
									<Bar data={chartData} options={chartOptions} />
								</div>
							</ChartCard>
						</div>
						{/* Member Type Donut */}
						<DonutCard
							value={254}
							label="Member Type"
							legend={donutLegend}
						/>
					</div>
					{/* Stat Cards Row */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<StatCard
							label="Total Payroll"
							value="$34,428.50"
							trend="▼ 24% vs Last Week"
							trendColor="text-red-500"
						>
							<span className="text-gray-300">[Bar Chart]</span>
						</StatCard>
						<StatCard
							label="Job Applicant"
							value="12,845"
							trend="▲ 15% vs Last Week"
							trendColor="text-green-500"
						>
							<span className="text-gray-300">[Bar Chart]</span>
						</StatCard>
					</div>
					{/* List of Members Table */}
					<MemberList members={mockMembers} />
				</div>
				{/* Right Column */}
				<div className="flex flex-col gap-6">
					{/* Checklist Widget */}
					<ChecklistWidget
						title="Today's Tasks"
						initialItems={[
							'Review resumes',
							'Team meeting at 2 PM',
							'Submit payroll',
						]}
					/>
				</div>
			</div>
		</div>
	);
};

// ChecklistWidget Component
const ChecklistWidget = ({ title, initialItems }) => {
	const [items, setItems] = React.useState(initialItems);
	const [checkedItems, setCheckedItems] = React.useState(
		Array(initialItems.length).fill(false)
	);
	const [newItem, setNewItem] = React.useState('');

	const toggleCheck = (index) => {
		setCheckedItems((prev) => {
			const newChecked = [...prev];
			newChecked[index] = !newChecked[index];
			return newChecked;
		});
	};

	const addItem = () => {
		if (newItem.trim() !== '') {
			setItems((prev) => [...prev, newItem]);
			setCheckedItems((prev) => [...prev, false]);
			setNewItem('');
		}
	};

	const deleteItem = (index) => {
		setItems((prev) => prev.filter((_, i) => i !== index));
		setCheckedItems((prev) => prev.filter((_, i) => i !== index));
	};

	const editItem = (index, newValue) => {
		setItems((prev) => {
			const updatedItems = [...prev];
			updatedItems[index] = newValue;
			return updatedItems;
		});
	};

	return (
		<div className="bg-white p-4 rounded-lg shadow border">
			<h2 className="text-lg font-bold mb-4">{title}</h2>
			<div className="flex gap-2 mb-4">
				<input
					type="text"
					value={newItem}
					onChange={(e) => setNewItem(e.target.value)}
					placeholder="Add new task"
					className="flex-1 border rounded px-2 py-1"
				/>
				<button
					onClick={addItem}
					className="bg-blue-500 text-white px-4 py-1 rounded"
				>
					Add
				</button>
			</div>
			<ul className="space-y-2">
				{items.map((item, index) => (
					<li key={index} className="flex items-center gap-2">
						<input
							type="checkbox"
							checked={checkedItems[index]}
							onChange={() => toggleCheck(index)}
							className="form-checkbox h-5 w-5 text-blue-600"
						/>
						<input
							type="text"
							value={item}
							onChange={(e) => editItem(index, e.target.value)}
							className={`flex-1 border-b focus:outline-none ${
								checkedItems[index]
									? 'line-through text-gray-400'
									: 'text-gray-800'
							}`}
						/>
						<button
							onClick={() => deleteItem(index)}
							className="text-red-500 hover:underline"
						>
							Delete
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export default HrDashboard;

import { apiClient } from './client'
import {
  DriverJob,
  JobApplication,
  DriverProfile,
  EmployerProfile,
  DriverVerification,
  PaginatedResponse,
  CreateJobDto,
  CreateApplicationDto,
  CreateDriverProfileDto,
  CreateEmployerProfileDto,
  ApplicationStatus
} from '../types/jobs.types'

export const jobsApi = {
  // Job Listings
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<DriverJob>>('/jobs', { params }),
  
  getById: (id: string) => 
    apiClient.get<DriverJob>(`/jobs/${id}`),
  
  create: (data: CreateJobDto) => 
    apiClient.post<DriverJob>('/jobs', data),
  
  update: (id: string, data: Partial<CreateJobDto>) => 
    apiClient.patch<DriverJob>(`/jobs/${id}`, data),
  
  closeJob: (id: string) => 
    apiClient.patch<DriverJob>(`/jobs/${id}`, { status: 'CLOSED' }),
  
  deleteJob: (id: string) => 
    apiClient.delete<void>(`/jobs/${id}`),

  // Job Applications
  apply: (id: string, data: CreateApplicationDto) =>
    apiClient.post<JobApplication>(`/jobs/${id}/apply`, data),
  
  getApplicants: (id: string) => 
    apiClient.get<JobApplication[]>(`/jobs/${id}/applications`),
  
  getMyApplications: () => 
    apiClient.get<JobApplication[]>('/jobs/my-applications'),
  
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) =>
    apiClient.patch<JobApplication>(`/jobs/applications/${applicationId}`, { status }),
  
  withdrawApplication: (applicationId: string) =>
    apiClient.post<JobApplication>(`/jobs/applications/${applicationId}/withdraw`),

  // Driver Profile
  driverProfileGet: () => 
    apiClient.get<DriverProfile>('/jobs/driver-profile/me'),
  
  driverProfileCreate: (data: CreateDriverProfileDto) =>
    apiClient.post<DriverProfile>('/jobs/driver-profile', data),
  
  driverProfileUpdate: (data: Partial<CreateDriverProfileDto>) =>
    apiClient.patch<DriverProfile>('/jobs/driver-profile', data),

  // Employer Profile
  employerProfileGet: () => 
    apiClient.get<EmployerProfile>('/jobs/employer-profile/me'),
  
  employerProfileCreate: (data: CreateEmployerProfileDto) =>
    apiClient.post<EmployerProfile>('/jobs/employer-profile', data),
  
  employerProfileUpdate: (data: Partial<CreateEmployerProfileDto>) =>
    apiClient.patch<EmployerProfile>('/jobs/employer-profile', data),

  // My listings (Dashboard)
  getMyJobs: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<DriverJob>>('/jobs/my', { params }),

  // Driver Directory
  getAllDrivers: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<DriverProfile>>('/jobs/drivers', { params }),
  
  getDriverById: (id: string) => 
    apiClient.get<DriverProfile>(`/jobs/drivers/${id}`),

  // Driver Verification
  submitVerification: (data: { licenseImageUrl: string; licenseBackImageUrl?: string; idImageUrl: string; idBackImageUrl?: string; notes?: string }) =>
    apiClient.post<DriverVerification>('/jobs/verification/submit', data),
  
  getVerificationStatus: () =>
    apiClient.get<DriverVerification>('/jobs/verification/status'),
}

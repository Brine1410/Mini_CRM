create database if not exists mini_crm;
use mini_crm;

create table users (
    user_id int auto_increment primary key,
    full_name varchar(100) not null,
    email varchar(150) not null unique,
    role enum('Sales Rep', 'Account Manager', 'Support Agent', 'Admin') default 'Sales Rep',
    created_at timestamp default current_timestamp
) engine=innodb;

create table leads (
    lead_id int auto_increment primary key,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    company_name varchar(100),
    email varchar(150) not null,
    phone varchar(20),
    status enum('New', 'Contacted', 'Qualified', 'Unqualified', 'Converted') default 'New',
    assigned_user_id int,
    created_at timestamp default current_timestamp,
    foreign key (assigned_user_id) references users(user_id) on delete set null
) engine=innodb;

create table accounts (
    account_id int auto_increment primary key,
    account_name varchar(100) not null,
    industry varchar(50),
    website varchar(150),
    annual_revenue decimal(15, 2),
    owner_user_id int,
    created_at timestamp default current_timestamp,
    foreign key (owner_user_id) references users(user_id) on delete set null
) engine=innodb;

create table contacts (
    contact_id int auto_increment primary key,
    account_id int,
    first_name varchar(50) not null,
    last_name varchar(50) not null,
    email varchar(150) not null,
    phone varchar(20),
    job_title varchar(100),
    owner_user_id int,
    created_at timestamp default current_timestamp,
    foreign key (account_id) references accounts(account_id) on delete set null,
    foreign key (owner_user_id) references users(user_id) on delete set null
) engine=innodb;

create table opportunities (
    opportunity_id int auto_increment primary key,
    account_id int not null,
    primary_contact_id int,
    title varchar(150) not null,
    amount decimal(15, 2) default 0.00,
    stage enum('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') default 'Prospecting',
    close_date date,
    owner_user_id int,
    created_at timestamp default current_timestamp,
    foreign key (account_id) references accounts(account_id) on delete cascade,
    foreign key (primary_contact_id) references contacts(contact_id) on delete set null,
    foreign key (owner_user_id) references users(user_id) on delete set null
) engine=innodb;

create table tickets (
    ticket_id int auto_increment primary key,
    account_id int,
    contact_id int not null,
    assigned_user_id int,
    subject varchar(200) not null,
    priority enum('Low', 'Medium', 'High', 'Urgent') default 'Medium',
    status enum('Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed') default 'Open',
    created_at timestamp default current_timestamp,
    foreign key (account_id) references accounts(account_id) on delete set null,
    foreign key (contact_id) references contacts(contact_id) on delete cascade,
    foreign key (assigned_user_id) references users(user_id) on delete set null
) engine=innodb;

create table activities (
    activity_id int auto_increment primary key,
    type enum('Call', 'Meeting', 'Email', 'Task', 'Note') not null,
    subject varchar(150) not null,
    description text,
    due_date timestamp null default null,
    status enum('Pending', 'Completed', 'Cancelled') default 'Pending',
    performed_by_user_id int not null,
    lead_id int default null,
    contact_id int default null,
    opportunity_id int default null,
    ticket_id int default null,
    created_at timestamp default current_timestamp,
    foreign key (performed_by_user_id) references users(user_id) on delete cascade,
    foreign key (lead_id) references leads(lead_id) on delete cascade,
    foreign key (contact_id) references contacts(contact_id) on delete cascade,
    foreign key (opportunity_id) references opportunities(opportunity_id) on delete cascade,
    foreign key (ticket_id) references tickets(ticket_id) on delete cascade
) engine=innodb;

create index idx_leads_assigned on leads(assigned_user_id);
create index idx_contacts_account on contacts(account_id);
create index idx_opps_account on opportunities(account_id);
create index idx_tickets_contact on tickets(contact_id);
create index idx_activities_lead on activities(lead_id);
create index idx_activities_contact on activities(contact_id);
create index idx_activities_opp on activities(opportunity_id);

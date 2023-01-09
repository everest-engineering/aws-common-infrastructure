import { Vpc } from "../imports/modules/vpc";
import { Construct } from "constructs";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { Fn, Token } from "cdktf";
import { CIDRBlock } from "@eryldor/cidr";

interface AwsVpcConfig {
    name: string,
    cidr: string,
};

export class AwsVpc extends Construct {
    vpc: Vpc;
    privateSubnetsOutput: string[];
    publicSubnetsOutput: string[];
    databaseSubnetsOutput: string[];
    constructor(scope: Construct, id: string, options: AwsVpcConfig) {
        super(scope, id);

        const cidr = CIDRBlock.fromString(options.cidr);
        const [publicSubnetBlock, privateSubnetBlock, databaseSubnetBlock] = cidr.split(3);
        const publicSubnets = publicSubnetBlock.split(2);
        const privateSubnets = privateSubnetBlock.split(2);
        const databaseSubnets = databaseSubnetBlock.split(2);

        const zones = new DataAwsAvailabilityZones(scope, 'zones', {
            state: 'available'
        });
        const vpcOptions = {
            name: options.name,
            cidr: options.cidr,
            azs: [Fn.element(zones.names, 0), Fn.element(zones.names, 1)],
            privateSubnets: privateSubnets.flatMap(privateSubnet => privateSubnet.toString()),
            publicSubnets: publicSubnets.flatMap(subnet => subnet.toString()),
            databaseSubnets: databaseSubnets.flatMap(subnet => subnet.toString()),
            enableNatGateway: true,
            oneNatGatewayPerAz: true,
            publicInboundAclRules: getPublicInboundAclRules(CIDRBlock.fromString(options.cidr)),
            publicOutboundAclRules: getPublicOutboundAclRules(),
            privateInboundAclRules: getPrivateInboundAclRules(CIDRBlock.fromString(options.cidr)),
            privateOutboundAclRules: getPrivateOutboundAclRules(CIDRBlock.fromString(options.cidr)),
            databaseInboundAclRules: getDatabaseInboundAclRules(publicSubnets, privateSubnets),
            databaseOutboundAclRules: getDatabaseOutboundAclRules(privateSubnets),
            createDatabaseSubnetRouteTable: true,
            defaultRouteTableName: 'Public Route table',
            publicAclTags: { 'Name': 'Public tier ACL' },
            privateAclTags: { 'Name': 'Application tier ACL' },
            databaseAclTags: { 'Name': 'Database tier ACL' },
            databaseSubnetGroupName: "database",
            flowLogCloudwatchLogGroupNamePrefix: options.name,
            flowLogTrafficType: "ALL",
            databaseDedicatedNetworkAcl: true,
            publicDedicatedNetworkAcl: true,
            privateDedicatedNetworkAcl: true,
            publicSubnetTags: { 'Tier': 'Public' },
            privateSubnetTags: { 'Tier': 'Private' },
            databaseSubnetTags: { 'Tier': 'Database' },
            publicRouteTableTags: { 'Tier': 'Public' },
            privateRouteTableTags: { 'Tier': 'Private' },
            databaseRouteTableTags: { 'Tier': 'Database' },
            enableDnsHostnames: true,
            enableDnsSupport: true
        };

        this.vpc = new Vpc(this, 'Vpc', vpcOptions);
        this.publicSubnetsOutput = Token.asList(this.vpc.publicSubnetsOutput);
        this.privateSubnetsOutput = Token.asList(this.vpc.privateSubnetsOutput);
        this.databaseSubnetsOutput = Token.asList(this.vpc.databaseSubnetsOutput);
    }
}

function getPublicInboundAclRules(vpcCidr: CIDRBlock): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '80', '80', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('110', 'allow', '443', '443', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('120', 'allow', '22', '22', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('140', 'allow', '1024', '65535', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('150', 'allow', '0', '0', '-1', vpcCidr),
    ]
}

function getPublicOutboundAclRules(): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '80', '80', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('110', 'allow', '443', '443', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('120', 'allow', '22', '22', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('140', 'allow', '1024', '65535', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
    ]
}

function getPrivateInboundAclRules(vpcCidr: CIDRBlock): { [key: string]: string; }[] {
    return [
        getAclRule('130', 'allow', '0', '0', '-1', vpcCidr),
        getAclRule('140', 'allow', '1024', '65535', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('150', 'allow', '443', '443', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('160', 'allow', '80', '80', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
    ]
}

function getAclRule(rule_number: string, rule_action: string, from_port: string, to_port: string, protocol: string, cidr_block: CIDRBlock): { [key: string]: string; } {
    return {
        'rule_number': rule_number,
        'rule_action': rule_action,
        'from_port': from_port,
        'to_port': to_port,
        'protocol': protocol,
        'cidr_block': cidr_block.toString()
    }
}

function getPrivateOutboundAclRules(vpcCidr: CIDRBlock): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '0', '0', '-1', vpcCidr),
        getAclRule('110', 'allow', '443', '443', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('120', 'allow', '80', '80', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
        getAclRule('130', 'allow', '1024', '65535', 'tcp', CIDRBlock.fromString('0.0.0.0/0')),
    ]
}

function getDatabaseInboundAclRules(publicSubnets: CIDRBlock[], privateSubnets: CIDRBlock[]): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'deny', '0', '0', '-1', publicSubnets[0]),
        getAclRule('110', 'deny', '0', '0', '-1', publicSubnets[1]),
        getAclRule('120', 'allow', '0', '0', '-1', privateSubnets[0]),
        getAclRule('130', 'allow', '0', '0', '-1', privateSubnets[1]),
    ]
}

function getDatabaseOutboundAclRules(privateSubnets: CIDRBlock[]): { [key: string]: string; }[] | undefined {
    return [
        getAclRule('100', 'allow', '0', '0', '-1', privateSubnets[0]),
        getAclRule('110', 'allow', '0', '0', '-1', privateSubnets[1]),
    ]
}




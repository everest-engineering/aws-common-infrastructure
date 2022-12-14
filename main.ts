
import { Construct } from "constructs";
import { App, TerraformStack, Token, TerraformOutput } from "cdktf";
import { AwsEcsCluster } from "./modules/aws-ecs-cluster";
import { AwsVpc } from "./modules/aws-vpc";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";


class EverestInfraStack extends TerraformStack {
  public awsVpc: AwsVpc;
  public ecsCluster: AwsEcsCluster;
  public publicSubnets: string[];
  public privateSubnets: string[];
  public databaseSubnets: string[];
  public vpcId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new AwsProvider(this, "AWS", {
      region: "ap-south-1"
    });

    // define resources here
    this.awsVpc = new AwsVpc(this, "everest-vpc", {
      name: 'everest-vpc',
      cidr: '10.0.0.0/21',
    });
    this.vpcId = Token.asString(this.awsVpc.vpc.vpcIdOutput);
    this.publicSubnets = this.awsVpc.publicSubnetsOutput;
    this.privateSubnets = this.awsVpc.privateSubnetsOutput;
    this.databaseSubnets = this.awsVpc.databaseSubnetsOutput;

    this.ecsCluster = new AwsEcsCluster(this, 'everest');

    new TerraformOutput(scope, 'EVEREST-VPC-ID', {
      value: this.vpcId
    })
    new TerraformOutput(scope, 'EVEREST-PUBLIC_SUBNETS', {
      value: this.publicSubnets
    })
    new TerraformOutput(scope, 'EVEREST-PRIVATE-SUBNETS', {
      value: this.privateSubnets
    })
    new TerraformOutput(scope, 'EVEREST-DATABASE-SUBNETS', {
      value: this.databaseSubnets
    })
    new TerraformOutput(scope, 'EVEREST-ECS-CLUSTER', {
      value: this.ecsCluster
    })
  }
}

const app = new App();
new EverestInfraStack(app, "aws-common-infrastructure");

// new S3Backend(stack, {
//   bucket: 'pg-cdktf-remote-state',
//   key: 'vpc',
//   encrypt: true,
//   region: REGION,
//   dynamodbTable: 'cdktf-state'
// });
app.synth();

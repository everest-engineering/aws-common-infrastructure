
import { Construct } from "constructs";
import { App, TerraformStack, Token, TerraformOutput, S3Backend } from "cdktf";
import { AwsEcsCluster } from "./modules/aws-ecs-cluster";
import { AwsVpc } from "./modules/aws-vpc";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";

const REGION = "ap-south-1";

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
      region: REGION
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

    new TerraformOutput(this, 'EVEREST-VPC-ID', {
      value: this.vpcId,
    });
    new TerraformOutput(this, 'EVEREST-ECS-CLUSTER', {
      value: this.ecsCluster.ecsCluster.name,
    });
    new TerraformOutput(this, 'EVEREST-DATABASE-SUBNETS', {
      value: this.databaseSubnets,
    });
  }
}

const app = new App();
const stack = new EverestInfraStack(app, "aws-common-infrastructure");

new S3Backend(stack, {
  bucket: 'pg-cdktf-remote-state',
  key: 'everest-infra/terraform.tfstate',
  encrypt: true,
  region: REGION,
  dynamodbTable: 'cdktf-dynamo'
});
app.synth();

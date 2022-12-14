import { Construct } from "constructs";
import { EcsCluster } from "../imports/providers/aws/ecs-cluster";
import { EcsClusterCapacityProviders } from "../imports/providers/aws/ecs-cluster-capacity-providers";

export class AwsEcsCluster extends Construct {
    ecsCluster: EcsCluster;
    constructor(scope: Construct, id: string) {
        super(scope, id);
        this.ecsCluster = new EcsCluster(scope, id + '-cluster', {
            name: 'everest',
            setting: [{ name: 'containerInsights', value: 'enabled' },
            ],
        });

        new EcsClusterCapacityProviders(this, `capacity-providers-everest`, {
            clusterName: this.ecsCluster.name,
            dependsOn: [this.ecsCluster],
            capacityProviders: ["FARGATE", "FARGATE_SPOT"],
        });
    }
}